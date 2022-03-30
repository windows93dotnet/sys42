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
  const url = new URL(e.request.url)
  const { id, mask } = disk.getIdAndMask(url.pathname)
  if (mask !== 0 && typeof id === "number") {
    // console.log(`🛰 ${url.pathname}: id:${id} mask:${mask}`)
    e.respondWith(
      getDriver(mask)
        .then((driver) => driver.open(url.pathname))
        .then((blob) => new Response(blob))
    )
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
