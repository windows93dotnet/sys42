export default function maxZIndex(selector = "body *", max = 0) {
  for (const el of document.querySelectorAll(selector)) {
    const val = Number.parseInt(getComputedStyle(el).zIndex, 10)
    if (val > max) max = val
  }

  return max
}
