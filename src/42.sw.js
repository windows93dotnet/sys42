import getDriver from "./42/system/fs/getDriver.js"
import Disk from "./42/system/fs/Disk.js"

const disk = new Disk()

self.addEventListener("install", (e) => {
  self.skipWaiting()
  e.waitUntil(disk.init())
})

self.addEventListener("activate", () => {
  self.clients.claim()
})

self.addEventListener("fetch", (e) => {
  // console.log("fetch", e.request.url)
  const url = new URL(e.request.url)
  const { id, mask } = disk.getIdAndMask(url.pathname)
  if (mask !== 0 && typeof id === "number") {
    console.log(`🛰 ${url.pathname}: id:${id} mask:${mask}`)
    e.respondWith(
      getDriver(mask)
        .then((driver) => driver.open(url.pathname))
        .then((blob) => new Response(blob))
    )

    // @read https://bugs.chromium.org/p/chromium/issues/detail?id=468227#c15
    // e.respondWith(
    //   new Response("Hello world", {
    //     headers: [
    //       ["content-type", "application/octet-stream; charset=utf-8"],
    //       ["Content-Disposition", "attachment; filename=test.txt"],
    //     ],
    //   })
    // )
  }
})

for (const event of [
  "activate",
  "controllerchange",
  "error",
  // "fetch",
  "install",
  "message",
  "statechange",
  "updatefound",
]) {
  self.addEventListener(event, () => {
    console.log(`🛰 ${event}`)
  })
}
