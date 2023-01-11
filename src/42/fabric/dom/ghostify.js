import applyStyleDeclaration from "./applyStyleDeclaration.js"

const { parseInt } = Number
const { round } = Math

export function ghostify(el, options) {
  let { x, y, width, height } = options?.rect ?? el.getBoundingClientRect()
  const clone = el.cloneNode(true)
  if (el.id) clone.id = `${el.id}--ghost`
  clone.classList.add("ghost")
  const styles = getComputedStyle(el)

  if (options?.subpixel !== true) {
    x = round(x)
    y = round(y)
    // width = round(width)
    // height = round(height)
  }

  const marginTop = parseInt(styles.marginTop, 10)
  const marginLeft = parseInt(styles.marginLeft, 10)

  if (options?.cloneStyles !== false) applyStyleDeclaration(clone, styles)

  clone.style.transition = "none"
  clone.style.position = "fixed"
  clone.style.zIndex = options?.zIndex ?? 1e5
  clone.style.pointerEvents = "none"
  clone.style.minWidth = "0"
  clone.style.minHeight = "0"
  clone.style.maxWidth = "none"
  clone.style.maxHeight = "none"

  if (styles.display === "inline") clone.style.display = "inline-block"

  clone.style.width = `${width}px`
  clone.style.height = `${height}px`
  clone.style.margin = 0
  clone.style.marginTop = marginTop
  clone.style.marginLeft = marginLeft
  clone.style.top = 0
  clone.style.left = 0
  clone.style.translate = `${x}px ${y}px`

  return clone
}

export default ghostify
