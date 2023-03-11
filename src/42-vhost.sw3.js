import getPathInfos from "./42/core/path/getPathInfos.js"
import uid from "./42/core/uid.js"

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
            if (client.url.startsWith(location.origin + "/42-vhost3.html")) {
              return client
            }
          }
        })
        .then((client) => {
          const { port1, port2 } = new MessageChannel()

          return new Promise((resolve) => {
            port1.onmessage = (e) => {
              resolve(e.data)
            }

            const id = uid()
            client.postMessage(
              {
                type: "42_VHOST_PROXY_REQ",
                id,
                pathname,
              },
              [port2]
            )
          })
        })
        .then((buffer) => new Response(buffer, { headers }))
    )
  }
})

for (const event of [
  "activate",
  "controllerchange",
  "error",
  "install",
  "statechange",
  "updatefound",
]) {
  self.addEventListener(event, () => {
    console.log(`🫴 ${event}`)
  })
}
