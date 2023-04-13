/* eslint-disable import/no-unresolved */
import system from "../../system.js"
import ipc from "../../core/ipc.js"
import listen from "../../fabric/event/listen.js"
import isHashmapLike from "../../fabric/type/any/is/isHashmapLike.js"

class Client {
  get controller() {
    return navigator.serviceWorker.controller
  }

  #bus
  get bus() {
    if (!navigator.serviceWorker.controller) return
    this.#bus ??= ipc.to(navigator.serviceWorker.controller)
    return this.#bus
  }

  async connect(options) {
    let url =
      typeof options === "string" ? options : options?.url ?? "/42.sw.js"

    if (isHashmapLike(options)) {
      const query = []
      for (const [key, val] of Object.entries(options)) {
        if (key === "url") continue
        query.push(`${key}=${encodeURIComponent(val)}`)
      }

      if (query.length > 0) url += `?${query.join("&")}`
    }

    this.registration = await navigator.serviceWorker //
      .register(url, { type: "module" })

    const hasController = navigator.serviceWorker.controller

    if (this.registration) {
      // prevent hard refresh to disable service worker https://stackoverflow.com/a/62596701
      if (this.registration.active && !hasController) location.reload()

      this.registration.addEventListener("updatefound", () => {
        console.log("Service Worker update found!")
      })
    }

    if (!hasController) {
      await new Promise((resolve) => {
        const forget = listen(navigator.serviceWorker, {
          controllerchange() {
            if (navigator.serviceWorker.controller) {
              forget()
              resolve()
            }
          },
        })
      })
    }

    this.bus.send("42_SW_GET_CONFIG").then((config) => {
      if (config.dev && !system.dev) import("../../dev.js?verbose=2&service")
    })
  }
}

const client = new Client()

export { client }
export default client
