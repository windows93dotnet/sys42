import normalizeError from "../../fabric/type/error/normalizeError.js"

const SELECTORS = {
  "audio": "audio",
  "iframe": "document",
  "embed": "embed",
  "img, picture, image": "image",
  "object": "object",
  "script": "script",
  "link[rel='stylesheet'], style": "style",
  "track": "track",
  "video": "video",
}

const MIMETYPES = {
  "text/html": "document",
  "text/javascript": "script",
  "text/css": "style",
  "text/vtt": "track",
}

function fromElement(el) {
  for (const [selector, as] of Object.entries(SELECTORS)) {
    if (el.matches(selector)) return as
  }
}

let parseFilename
async function fromURL(url) {
  parseFilename ??= await import("../../core/path/parseFilename.js") //
    .then((m) => m.default)
  const { mimetype } = parseFilename(url)
  if (mimetype in MIMETYPES) return [MIMETYPES[mimetype], mimetype]
  if (mimetype.startsWith("image/")) return ["image", mimetype]
  if (mimetype.startsWith("audio/")) return ["audio", mimetype]
  if (mimetype.startsWith("video/")) return ["video", mimetype]
  if (mimetype.startsWith("font/")) return ["font", mimetype]
  return ["fetch", mimetype]
}

export default async function preload(
  url,
  { as, crossorigin, media, type, signal } = {}
) {
  let el = document.createElement("link")
  el.rel = "preload"

  if (crossorigin) el.crossorigin = crossorigin
  if (media) el.media = media
  if (type) el.type = type

  if (as instanceof Element) as = fromElement(as)

  if (as === undefined || type === true) {
    const res = await fromURL(url)
    el.as = as ?? res[0]
    el.type = res[1]
  } else {
    el.as = as
  }

  if (as === "fetch" || as === "font") el.crossorigin = true

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      signal?.removeEventListener("abort", onabort)
      el.onerror = null
      el.onload = null
      el.remove()
      el.removeAttribute("href")
      el = null
    }

    const onabort = () => {
      cleanup(el)
      reject(signal.reason)
    }

    signal?.addEventListener("abort", onabort)

    el.onerror = (e) => {
      cleanup()
      reject(normalizeError(e))
    }

    el.onload = () => {
      cleanup()
      resolve()
    }

    el.href = url
    document.head.append(el)
  })
}
