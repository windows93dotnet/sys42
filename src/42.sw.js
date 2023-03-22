/* 1 */

// @read https://bugs.chromium.org/p/chromium/issues/detail?id=468227#c15

const VERSION = "0.0.0"

import ipc from "/42/core/ipc.js"
import getPathInfos from "/42/core/path/getPathInfos.js"
import getBasename from "./42/core/path/core/getBasename.js"
import getDriver from "/42/core/fs/getDriver.js"
import Disk from "/42/core/fs/Disk.js"
import tarExtractPipe from "/42/core/formats/tar/tarExtractPipe.js"

const disk = new Disk()
const isVhost = new URLSearchParams(location.search).has("vhost")
const vhostURL = location.origin + "/42/os/network/vhost.html"

ipc.on("42_SW_DISK_INIT", async () => disk.init(await getVhostClient()))

async function getVhostClient() {
  const clients = await self.clients.matchAll({ type: "window" })
  for (const client of clients) {
    if (client.url.startsWith(vhostURL)) return client
  }
}

async function network(e) {
  return (await e.preloadResponse) ?? fetch(e.request)
}

async function cacheOrNetwork(e) {
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
      if (!inode) return cacheOrNetwork(e)

      const { headers } = getPathInfos(pathname, { headers: true })

      const driver = await getDriver(inode[1])
      const blob = await driver.open(pathname)
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
      if (!inode) return network(e)

      const { headers } = getPathInfos(pathname, { headers: true })

      const client = isVhost ? await getVhostClient() : undefined
      if (!client) return network(e)

      const blob = await ipc.to(client).sendOnce("42_VHOST_PROXY_REQ", pathname)
      return new Response(blob, { headers })
    })()
  )
}

self.addEventListener("fetch", isVhost ? proxy : serve)

self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      if (isVhost) return self.skipWaiting()

      const [res, cache] = await Promise.all([
        fetch(`/42-kits/${VERSION}.tar.gz`),
        caches.open(VERSION),
      ])

      if (!res.ok) return self.skipWaiting()

      const undones = []

      const sink = new WritableStream({
        async write(item) {
          if (item.type === "file") {
            const { headers } = getPathInfos(item.name, { headers: true })
            headers["Content-Length"] = item.size
            const res = new Response(item.file, { headers })

            if (item.name.endsWith("index.html")) {
              undones.push(cache.put(getBasename(item.name), res.clone()))
            }

            undones.push(cache.put(item.name, res))
          }
        },
      })

      await res.body.pipeThrough(tarExtractPipe({ gzip: true })).pipeTo(sink)
      await Promise.all(undones)
      await self.skipWaiting()
    })()
  )
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      await self.registration.navigationPreload.enable() // [1]
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map((cacheName) =>
          cacheName === VERSION ? undefined : caches.delete(cacheName)
        )
      )
    })()
  )
  self.clients.claim()
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
    console.log((isVhost ? "🌐🛰️" : "📡🛰️") + ` ${event}`)
  })
}

// [1] https://developers.google.com/web/updates/2017/02/navigation-preload
