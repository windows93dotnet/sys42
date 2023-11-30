export async function isURLCrossOrigin(url, signal) {
  let el = document.createElement("iframe")
  el.style.position = "fixed"
  el.style.width = 0
  el.style.height = 0
  el.style.opacity = 0.001
  el.style.pointerEvents = "none"

  el.sandbox = "allow-scripts"
  el.srcdoc = `
    <script type="module">
      const check = await fetch("${url}")
        .then((res) => res.type === "cors")
        .catch((res) => false)
      window.parent.postMessage(check, "${location.origin}")
    </script>`

  return new Promise((resolve) => {
    const cleanup = () => {
      signal?.removeEventListener("abort", onabort)
      window.removeEventListener("message", onmessage)
      el.removeAttribute("srcdoc")
      el.remove()
      el = null
    }

    const onabort = () => {
      cleanup()
      resolve()
    }

    signal?.addEventListener("abort", onabort)

    const onmessage = ({ data, source }) => {
      if (el.contentWindow === source) {
        cleanup()
        resolve(data)
      }
    }

    window.addEventListener("message", onmessage)

    document.body.append(el)
  })
}

export default isURLCrossOrigin
