/* eslint-disable import/no-unresolved */
import system from "../../system.js"
import ipc from "../../core/ipc.js"
import isHashmapLike from "../../fabric/type/any/is/isHashmapLike.js"

const client = {}

client.connect = async (options) => {
  let url = typeof options === "string" ? options : options?.url ?? "/42.sw.js"

  if (isHashmapLike(options)) {
    const query = []
    for (const [key, val] of Object.entries(options)) {
      if (key === "url") continue
      query.push(`${key}=${encodeURIComponent(val)}`)
    }

    if (query.length > 0) url += `?${query.join("&")}`
  }

  const registration = await navigator.serviceWorker //
    .register(url, { type: "module" })

  const hasController = navigator.serviceWorker.controller

  if (registration) {
    // prevent hard refresh to disable service worker https://stackoverflow.com/a/62596701
    if (registration.active && !hasController) location.reload()

    registration.addEventListener("updatefound", () => {
      console.log("Service Worker update found!")
    })
  }

  if (!hasController) {
    await new Promise((resolve) => {
      const controller = new AbortController()
      const { signal } = controller
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          if (navigator.serviceWorker.controller) {
            controller.abort()
            resolve()
          }
        },
        { signal }
      )
    })
  }

  const { controller } = navigator.serviceWorker

  if (controller) {
    ipc
      .to(controller)
      .sendOnce("42_SW_GET_CONFIG")
      .then((config) => {
        // if (config.dev) {
        //   if (system.dev) system.dev.connect()
        //   else import("../../dev.js?verbose=2&service")
        // }

        if (config.dev && !system.dev) import("../../dev.js?verbose=2&service")
      })
  }

  return { registration, controller }
}

export { client }
export default client
