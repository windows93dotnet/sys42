/* 1 */

// @read https://bugs.chromium.org/p/chromium/issues/detail?id=468227#c15
// @read https://stackoverflow.com/q/62041644

import getDriver from "./42/core/fs/getDriver.js"
import getPathInfos from "./42/core/path/getPathInfos.js"
import Disk from "./42/core/fs/Disk.js"

const disk = new Disk()

self.addEventListener("install", (e) => {
  self.skipWaiting()
  e.waitUntil(disk.init())
})

self.addEventListener("activate", () => {
  self.clients.claim()
})

self.addEventListener("fetch", async (e) => {
  const { pathname } = new URL(e.request.url)

  // console.log(`🛰 ${pathname}`)

  const inode = disk.get(
    pathname.endsWith("/") ? pathname + "index.html" : pathname
  )

  if (!inode) return

  const infos = getPathInfos(pathname, { headers: true })

  // console.group(`🛰 ${pathname}`)
  // console.log(e.request)
  // console.log(infos)
  // console.log(inode)
  // console.groupEnd()

  e.respondWith(
    getDriver(inode[1])
      .then((driver) => driver.open(pathname))
      .then(
        (blob) =>
          new Response(blob, {
            headers: {
              ...infos.headers,
              // "Content-Security-Policy": "sandbox allow-scripts; default-src 'self' data:; script-src 'self' 'unsafe-inline';",
              // "Cross-Origin-Resource-Policy": "same-origin",
              // "Cross-Origin-Embedder-Policy:": "require-corp",
              // "Cross-Origin-Opener-Policy:": "same-origin",
            },
          })
      )
  )
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
    console.log(`🛰 ${event}`)
  })
}
