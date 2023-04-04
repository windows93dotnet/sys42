import ipc from "../../core/ipc.js"

const client = {}

client.connect = async (url = "/42.sw.js") => {
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
        // eslint-disable-next-line import/no-unresolved
        if (config.dev) import("../../dev.js?verbose=2&service")
      })
  }

  return { registration, controller }
}

export { client }
export default client
