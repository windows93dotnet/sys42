export async function isURLIframable(url, signal) {
  let el = document.createElement("object")
  el.style.position = "fixed"
  el.style.width = 0
  el.style.height = 0
  el.style.opacity = 0.001
  el.style.pointerEvents = "none"

  el.data = url

  return new Promise((resolve) => {
    const cleanup = () => {
      signal?.removeEventListener("abort", onabort)
      el.onerror = null
      el.onload = null
      el.removeAttribute("data")
      el.remove()
      el = null
    }

    const onabort = () => {
      cleanup()
      resolve()
    }

    signal?.addEventListener("abort", onabort)

    el.onerror = () => {
      cleanup()
      resolve(false)
    }

    el.onload = () => {
      cleanup()
      resolve(true)
    }

    document.body.append(el)
  })
}

export default isURLIframable
