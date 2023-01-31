import loadImage from "../../core/load/loadImage.js"
import arrify from "../type/any/arrify.js"

export async function resizeImage(src, size, options) {
  if (typeof src === "object" && src instanceof HTMLImageElement === false) {
    options = src
    src = options.src
    size = options.size
  }

  const type = typeof src
  const img = await loadImage(src)

  if (!size && options?.width !== undefined) {
    size = [options.width]
    if (options?.height !== undefined) size.push(options.height)
  }

  const sizes = arrify(size)
  if (sizes.length === 1) sizes.push(sizes[0])

  const margin = options?.margin ?? 0
  const padding = options?.padding ?? 0

  const canvas = document.createElement("canvas")
  canvas.width = sizes[0] + margin * 2
  canvas.height = sizes[1] + margin * 2
  const ctx = canvas.getContext("2d")

  if (padding) {
    sizes[0] -= padding * 2
    sizes[1] -= padding * 2
  }

  if (options?.pixelated !== false) ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, margin + padding, margin + padding, ...sizes)

  const output = options?.output ?? (type === "string" ? "url" : "img")

  if (output === "canvas") return canvas
  if (output === "url") return canvas.toDataURL()
  if (output === "img") {
    const dataurl = canvas.toDataURL()
    const out = document.createElement("img")
    out.src = dataurl
    return out
  }
}

export default resizeImage
