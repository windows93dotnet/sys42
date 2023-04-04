// @read https://bugs.chromium.org/p/chromium/issues/detail?id=468227#c15

import ipc from "../../../core/ipc.js"
import configure from "../../../core/configure.js"
import parseURLQuery from "../../../fabric/url/parseURLQuery.js"
import getPathInfos from "../../../core/path/getPathInfos.js"
import serverSentEvents from "../../../core/dev/serverSentEvents.js"
import getDriver from "../../../core/fs/getDriver.js"
import Disk from "../../../core/fs/Disk.js"
import kit from "./installKit.js"

const disk = new Disk()
const VHOST_URL = new URL("../client/vhost.html", import.meta.url).href

async function getVhostClient() {
  const clients = await self.clients.matchAll({ type: "window" })
  for (const client of clients) {
    if (client.url.startsWith(VHOST_URL)) return client
  }
}

async function fromNetwork(e) {
  return (await e.preloadResponse) ?? fetch(e.request)
}

async function fromCacheOrNetwork(e) {
  return (
    (await caches.match(e.request)) ??
    (await e.preloadResponse) ??
    fetch(e.request)
  )
}

function serve(e) {
  let { pathname, search } = new URL(e.request.url)
  if (search.includes("clear-site-data")) return
  if (pathname.endsWith("/")) pathname += "index.html"

  e.respondWith(
    (async () => {
      if (!disk.synced) await disk.init()
      const inode = disk.get(pathname)
      if (!inode) return fromCacheOrNetwork(e)

      const driver = await getDriver(inode[1])
      const blob = await driver.open(pathname)
      const { headers } = getPathInfos(pathname, { headers: true })
      return new Response(blob, { headers })
    })()
  )
}

function proxy(e) {
  let { pathname, search } = new URL(e.request.url)
  if (search.includes("clear-site-data")) return
  if (pathname.endsWith("/")) pathname += "index.html"

  e.respondWith(
    (async () => {
      const inode = disk.get(pathname)
      if (!inode) return fromNetwork(e)

      const client = await getVhostClient()
      if (!client) return fromNetwork(e)

      const blob = await ipc.to(client).sendOnce("42_VHOST_PROXY_REQ", pathname)
      const { headers } = getPathInfos(pathname, { headers: true })
      return new Response(blob, { headers })
    })()
  )
}

function initDev(config) {
  const logIcon = config.vhost ? "🌐🛰️" : "🌍🛰️"

  serverSentEvents("/42-dev")
    .on("connect", () => {
      console.log(`${logIcon}🔭 connect`)
    })
    .on("disconnect", () => {
      console.log(`${logIcon}🔭💥 disconnected {grey /42-dev}`)
    })
    .on("error", (msg) => {
      console.log(`${logIcon}🔭💥 ${msg}`)
    })
    .on("change", ({ data }) => {
      console.log(`${logIcon}🔭 change ${data}`)
      kit.update(data)
    })
    .on("reload", () => {
      console.log(`${logIcon}🔭 reload`)
    })

  for (const event of ["activate", "error", "install", "message"]) {
    self.addEventListener(event, () => {
      console.log(`${logIcon} -(${event})`)
    })
  }
}

export function installService(options) {
  const config = configure(options, parseURLQuery(location.search))

  ipc.on("42_SW_DISK_INIT", async () => disk.init(await getVhostClient()))
  ipc.on("42_SW_GET_CONFIG", async () => config)

  self.addEventListener("fetch", config.vhost ? proxy : serve)

  self.addEventListener("install", (e) => {
    e.waitUntil(
      (async () => {
        if (!config.vhost && config.version) await kit.install(config.version)
        await self.skipWaiting() // TODO: test this on sw update
      })()
    )
  })

  self.addEventListener("activate", (e) => {
    e.waitUntil(
      (async () => {
        // @read https://developers.google.com/web/updates/2017/02/navigation-preload
        await self.registration.navigationPreload.enable()

        if (!config.version) return

        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map((cacheName) =>
            cacheName === config.version ? undefined : caches.delete(cacheName)
          )
        )
      })()
    )
    self.clients.claim() // Should be moved inside waitUntil ?
  })

  if (config.dev) initDev(config)
}

export default installService
