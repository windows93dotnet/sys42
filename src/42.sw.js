// @read https://bugs.chromium.org/p/chromium/issues/detail?id=468227#c15
// @read https://stackoverflow.com/q/62041644

import getDriver from "./42/core/fs/getDriver.js"
import parseFilename from "./42/core/path/parseFilename.js"
import Disk from "./42/core/fs/Disk.js"

const disk = new Disk()

self.addEventListener("install", (e) => {
  self.skipWaiting()
  e.waitUntil(disk.init())
})

self.addEventListener("activate", () => {
  self.clients.claim()
})

self.addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url)

  // console.log(`🛰 ${pathname}`)

  const { id, mask } = pathname.endsWith("/")
    ? disk.getIdAndMask(pathname + "index.html")
    : disk.getIdAndMask(pathname)

  if (mask !== 0 && typeof id === "number") {
    const obj = parseFilename(pathname, { headers: true })

    // console.group(`🛰 ${pathname}: id:${id} mask:${mask}`)
    // console.log(e.request)
    // console.log(obj)
    // console.groupEnd()

    e.respondWith(
      getDriver(mask)
        .then((driver) => driver.open(pathname))
        .then(
          (blob) =>
            new Response(blob, {
              headers: {
                ...obj.headers,
                // "Content-Security-Policy": "sandbox allow-scripts; default-src 'self' data:; script-src 'self' 'unsafe-inline';",
                // "Cross-Origin-Resource-Policy": "same-origin",
                // "Cross-Origin-Embedder-Policy:": "require-corp",
                // "Cross-Origin-Opener-Policy:": "same-origin",
              },
            })
        )
    )
  }
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
