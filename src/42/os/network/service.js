// @read https://crbug.com/468227#c15
// [1] TODO: Use ignoreSearch option when this bug will be fixed https://crbug.com/682677

import ipc from "../../core/ipc.js"
import configure from "../../core/configure.js"
import parseURLQuery from "../../fabric/url/parseURLQuery.js"
import getPathInfos from "../../core/path/getPathInfos.js"
import getDriver from "../../core/fs/getDriver.js"
import FileIndex from "../../core/fs/FileIndex.js"
import kit from "./service/kit.js"

const service = {}

const fileIndex = new FileIndex()
const VHOST_URL = new URL("./client/vhost.html", import.meta.url).href

async function getVhostClient() {
  const clients = await self.clients.matchAll({ type: "window" })
  for (const client of clients) {
    if (client.url.startsWith(VHOST_URL)) return client
  }
}

async function fromNetwork(e) {
  return (await e.preloadResponse) ?? fetch(e.request)
}

async function fromCacheOrNetwork(e, pathname) {
  return (
    (await caches.match(pathname)) ?? // [1]
    (await e.preloadResponse) ??
    fetch(e.request)
  )
}

function getHeaders(searchParams) {
  const headers = {}
  if (searchParams.has("clear-site-data")) {
    if (searchParams.has("empty")) return false
    headers["Clear-Site-Data"] = '"cache", "storage"'
  }

  return headers
}

function serve(e) {
  let { pathname, searchParams } = new URL(e.request.url)
  let headers = getHeaders(searchParams)
  if (headers === false) return

  if (pathname.endsWith("/")) pathname += "index.html"

  e.respondWith(
    (async () => {
      if (!fileIndex.synced) await fileIndex.init()
      const inode = fileIndex.get(pathname)
      if (!inode) return fromCacheOrNetwork(e, pathname)

      const driver = await getDriver(inode[1])
      const blob = await driver.open(pathname)
      headers = getPathInfos(pathname, { headers }).headers
      return new Response(blob, { headers })
    })(),
  )
}

function proxy(e) {
  let { pathname, searchParams } = new URL(e.request.url)
  let headers = getHeaders(searchParams)
  if (headers === false) return

  if (pathname.endsWith("/")) pathname += "index.html"

  e.respondWith(
    (async () => {
      const inode = fileIndex.get(pathname)
      if (!inode) return fromNetwork(e)

      const client = await getVhostClient()
      if (!client) return fromNetwork(e)

      const blob = await ipc.to(client).sendOnce("42_VHOST_PROXY_REQ", pathname)
      headers = getPathInfos(pathname, { headers }).headers
      return new Response(blob, { headers })
    })(),
  )
}

service.install = (options) => {
  const config = configure(options, parseURLQuery(location.search))

  ipc.on("42_SW_HANDSHAKE", () => {
    self.registration.navigationPreload?.disable()
    return config
  })

  ipc.on("42_SW_DISK_INIT", async () =>
    fileIndex.init(config.proxy ? await getVhostClient() : undefined),
  )

  if (!config.proxy && config.dev) {
    ipc.on("42_SW_CACHE_BUST", async (path) => kit.update(path, config.version))
  }

  self.addEventListener("fetch", config.proxy ? proxy : serve)

  self.addEventListener("install", (e) => {
    e.waitUntil(
      (async () => {
        if (!config.proxy && config.version) await kit.install(config.version)
        await self.skipWaiting() // TODO: test this on sw update
      })(),
    )
  })

  self.addEventListener("activate", (e) => {
    e.waitUntil(
      (async () => {
        // @read https://developers.google.com/web/updates/2017/02/navigation-preload
        await self.registration.navigationPreload?.enable()

        if (!config.version) return

        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map((cacheName) =>
            cacheName === config.version ? undefined : caches.delete(cacheName),
          ),
        )
      })(),
    )
    self.clients.claim() // Should be moved inside waitUntil ?
  })

  if (config.dev && config.verbose > 2) {
    const logIcon = config.proxy ? "🌐🛰️" : "🌍🛰️"
    for (const event of ["activate", "error", "install", "message"]) {
      self.addEventListener(event, () => {
        console.log(`${logIcon} -(${event})`)
      })
    }
  }
}

export { service }
export default service
