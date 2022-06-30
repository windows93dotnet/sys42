export default async function isIframable(url, signal) {
  const el = document.createElement("object")
  el.style.position = "fixed"
  el.style.width = "0"
  el.style.height = "0"
  el.style.visibility = "hidden"
  el.style.pointerEvents = "none"

  return new Promise((resolve) => {
    const cleanup = (el, signal) => {
      signal?.removeEventListener("abort", onabort)
      el.onerror = null
      el.onload = null
      el.removeAttribute("data")
      el.remove()
      el = null
    }

    const onabort = () => {
      cleanup(el, signal)
      resolve(false)
    }

    signal?.addEventListener("abort", onabort)

    el.onerror = () => {
      cleanup(el)
      resolve(false)
    }

    el.onload = () => {
      cleanup(el)
      resolve(true)
    }

    document.body.append(el)
    el.data = url
  })
}
