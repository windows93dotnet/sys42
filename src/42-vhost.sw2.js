import getPathInfos from "./42/core/path/getPathInfos.js"
import uid from "./42/core/uid.js"
import defer from "./42/fabric/type/promise/defer.js"

const LIST = new Set(["/test.html", "/test.css"])

const queue = new Map()

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", () => {
  self.clients.claim()
})

self.addEventListener("message", (e) => {
  console.log(e.data)
  if (queue.has(e.data.id)) {
    const deferred = queue.get(e.data.id)
    deferred.resolve(e.data.file)
  }
})

self.addEventListener("fetch", (e) => {
  const { pathname } = new URL(e.request.url)

  if (LIST.has(pathname)) {
    const infos = getPathInfos(pathname, { headers: true })

    e.respondWith(
      self.clients
        .matchAll()
        .then((clients) => {
          for (const client of clients) {
            if (client.url.startsWith(location.origin + "/42-vhost2.html")) {
              return client
            }
          }
        })
        .then((client) => {
          const id = uid()
          client.postMessage({ type: "42_REQUEST_URL", id, pathname })
          const deferred = defer()
          queue.set(id, deferred)
          return deferred
        })
        .then((file) => new Response(file, { headers: infos.headers }))
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
