const DEFAULTS = {
  media: "all",
  append: true,
}

function cleanup(el) {
  el.onload = null
  el.onerror = null
}

export default async function loadCSS(url, options) {
  return new Promise((resolve, reject) => {
    url += `?v=${Date.now()}`
    const config = { ...DEFAULTS, ...options }
    const el = document.createElement("link")
    el.rel = "stylesheet"
    if (config.media !== "all") el.media = config.media

    el.onload = async () => {
      // TODO: check styles are applied
      setTimeout(() => resolve(el), 100)
      cleanup(el)
    }

    el.onerror = async () => {
      const rejectAsset = await import("./inc/rejectAsset.js") //
        .then((m) => m.default)
      rejectAsset(reject, "Stylesheet not loaded correctly", url)
      cleanup(el)
    }

    if (config.append) document.head.append(el)
    else document.head.prepend(el)

    el.href = url
    return el
  })
}
