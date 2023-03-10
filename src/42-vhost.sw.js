import ipc from "./42/core/ipc.js"
import getPathInfos from "./42/core/path/getPathInfos.js"

const LIST = new Set(["/test.html", "/test.css"])

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", () => self.clients.claim())

self.addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url)

  if (LIST.has(pathname)) {
    const { headers } = getPathInfos(pathname, { headers: true })

    e.respondWith(
      self.clients
        .matchAll({ type: "window" })
        .then((clients) => {
          for (const client of clients) {
            if (client.url.startsWith(location.origin + "/42-vhost.html")) {
              return client
            }
          }
        })
        .then(async (client) => {
          const bus = ipc.to(client)
          const buffer = await bus.send("42_VHOST_PROXY_REQ", pathname)
          bus.destroy()
          return new Response(buffer, { headers })
        })
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
    console.log(`🫴 ${event}`)
  })
}
