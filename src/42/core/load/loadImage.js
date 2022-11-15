import LoadError from "./inc/LoadError.js"

const checkImage = (img) => img.complete && img.width > 0

const resolveImage = (img) => {
  if (checkImage(img)) return Promise.resolve(img)
  return Promise.reject(
    new LoadError(`Invalid image: ${img.src}`, { url: img.src })
  )
}

const rejectImage = async (url, reject) => {
  const rejectAsset = await import("./inc/rejectAsset.js") //
    .then((m) => m.default)
  rejectAsset(reject, `Invalid image: ${url}`, url)
}

export const loadImage = (src) => {
  if (src instanceof HTMLImageElement) {
    if (src.complete) return resolveImage(src)
    return new Promise((resolve, reject) => {
      src.onload = () => resolveImage(src).then(resolve, reject)
      src.onerror = () => rejectImage(src.src, reject)
    })
  }

  return new Promise((resolve, reject) => {
    const asset = new Image()
    asset.onload = () => resolveImage(asset).then(resolve, reject)
    asset.onerror = () => rejectImage(src, reject)
    asset.src = src
  })
}

export default loadImage
