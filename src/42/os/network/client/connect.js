export async function connect(url = "/42.sw.js") {
  const registration = await navigator.serviceWorker //
    .register(url, { type: "module" })

  if (registration) {
    registration.addEventListener("updatefound", () => {
      console.log("Service Worker update found!")
    })
  }

  // await navigator.serviceWorker.ready
  const { controller } = navigator.serviceWorker
  if (controller) return { registration, controller }

  return new Promise((resolve) => {
    navigator.serviceWorker.oncontrollerchange = () => {
      if (navigator.serviceWorker.controller) {
        const { controller } = navigator.serviceWorker
        resolve({ registration, controller })
      }
    }
  })
}

export default connect
