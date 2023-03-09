import ipc from "./42/core/ipc.js"
import getPathInfos from "./42/core/path/getPathInfos.js"

const LIST = new Set(["/test.html", "/test.css"])

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", () => self.clients.claim())

self.addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url)

  if (LIST.has(pathname)) {
    const infos = getPathInfos(pathname, { headers: true })

    e.respondWith(
      self.clients
        .matchAll()
        .then((clients) => {
          for (const client of clients) {
            if (client.url.startsWith(location.origin + "/42-vhost.html")) {
              return client
            }
          }
        })
        .then((client) => ipc.to(client).send("42_REQUEST_URL", pathname))
        .then((args) => new Response(args, { headers: infos.headers }))
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
