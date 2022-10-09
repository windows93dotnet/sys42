// @read https://bugs.chromium.org/p/chromium/issues/detail?id=468227#c15

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
  // console.log(pathname)

  if (pathname === "/vhost.html") {
    const res = new Response(
      `
<link rel="stylesheet" href="/test.css">
yo vhost!!
<script type="module">
console.log(111, location)
console.log(112, window.top.document.body.append("evil"))
</script>

      `,
      {
        headers: {
          // "Origin": "null",
          "Content-Type": "text/html",
          "Content-Security-Policy": "sandbox allow-scripts;",
          // "sandbox allow-scripts allow-same-origin; default-src https://localhost:4200 'unsafe-inline' data:;",
          // "Cross-Origin-Resource-Policy": "same-origin",
          // "Cross-Origin-Embedder-Policy:": "require-corp",
          // "Cross-Origin-Opener-Policy:": "same-origin",
        },
      }
    )
    e.respondWith(res)
    return
  }

  const { id, mask } = pathname.endsWith("/")
    ? disk.getIdAndMask(pathname + "index.html")
    : disk.getIdAndMask(pathname)

  if (mask !== 0 && typeof id === "number") {
    const obj = parseFilename(pathname, { headers: true })

    console.group(`🛰 ${pathname}: id:${id} mask:${mask}`)
    console.log(e.request)
    console.log(obj)
    console.groupEnd()

    e.respondWith(
      getDriver(mask)
        .then((driver) => driver.open(pathname))
        .then(
          (blob) =>
            new Response(blob, {
              headers: {
                ...obj.headers,
                "Content-Security-Policy": "sandbox allow-scripts;",
                // "sandbox allow-scripts allow-same-origin; default-src https://localhost:4200 'unsafe-inline' data:;",

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
