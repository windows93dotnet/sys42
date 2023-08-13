import ipc from "../../../42/core/ipc.js"
import env from "../../../42/core/env.js"

ipc.emit(location.search.slice(3), env)

setTimeout(() => {
  try {
    self.close()
  } catch {}
}, 3000)

if (env.realm.inServiceWorker) {
  self.addEventListener("install", () => {
    self.skipWaiting()
  })

  self.addEventListener("activate", () => {
    setTimeout(() => {
      self.registration
        .unregister()
        .then((res) => console.log("unregistered", res))
    }, 3000)
  })
}
