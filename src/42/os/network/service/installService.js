// @read https://bugs.chromium.org/p/chromium/issues/detail?id=468227#c15

import ipc from "../../../core/ipc.js"
import getPathInfos from "../../../core/path/getPathInfos.js"
import getDriver from "../../../core/fs/getDriver.js"
import Disk from "../../../core/fs/Disk.js"
import installKit from "./installKit.js"
import serverSentEvents from "../../../core/dev/serverSentEvents.js"

const disk = new Disk()
const isVhost = new URLSearchParams(location.search).has("vhost")
const VHOST_URL = new URL("../client/vhost.html", import.meta.url).href

ipc.on("42_SW_DISK_INIT", async () => disk.init(await getVhostClient()))

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

function initDev() {
  const logIcon = isVhost ? "🌐🛰️" : "🌍🛰️"
  const sse = serverSentEvents("/42-dev")
  sse
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
    })
    .on("reload", () => {
      console.log(`${logIcon}🔭 reload`)
    })

  for (const event of [
    "activate",
    "controllerchange",
    "error",
    "install",
    "message",
    "statechange",
    "updatefound",
  ]) {
    self.addEventListener(event, () => {
      console.log(`${logIcon} -(${event})`)
    })
  }
}

export function installService(options) {
  self.addEventListener("fetch", isVhost ? proxy : serve)

  self.addEventListener("install", (e) => {
    e.waitUntil(
      (async () => {
        if (!isVhost && options?.version) await installKit(options?.version)
        await self.skipWaiting()
      })()
    )
  })

  self.addEventListener("activate", (e) => {
    e.waitUntil(
      (async () => {
        // @read https://developers.google.com/web/updates/2017/02/navigation-preload
        await self.registration.navigationPreload.enable()

        if (!options?.version) return

        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map((cacheName) =>
            cacheName === options?.version
              ? undefined
              : caches.delete(cacheName)
          )
        )
      })()
    )
    self.clients.claim()
  })

  if (options?.dev) initDev()
}

export default installService
