export default async function isIframable(url, signal) {
  const el = document.createElement("object")
  el.style.position = "fixed"
  el.style.width = "0"
  el.style.height = "0"
  el.style.visibility = "hidden"
  el.style.pointerEvents = "none"

  return new Promise((resolve) => {
    const cleanup = (el, signal) => {
      el.onerror = null
      el.onload = null
      el.data = "about:blank"
      el.remove()
      el = null
      signal?.removeEventListener("abort", onabort)
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

    el.data = url
    document.body.append(el)
  })
}
