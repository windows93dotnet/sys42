import applyStyleDeclaration from "./applyStyleDeclaration.js"

export function area(el, options) {
  let { x, y, width, height } = el.getBoundingClientRect()
  const styles = getComputedStyle(el)

  if (options?.subpixel !== true) {
    x = Math.round(x)
    y = Math.round(y)
    width = Math.round(width)
    height = Math.round(height)
  }

  const area = {}
  area.marginTop = Number.parseInt(styles.marginTop, 10)
  area.marginLeft = Number.parseInt(styles.marginLeft, 10)
  area.marginRight = Number.parseInt(styles.marginRight, 10)
  area.marginBottom = Number.parseInt(styles.marginBottom, 10)
  area.x = x
  area.y = y
  area.width = width
  area.height = height
  return area
}

export function ghostify(el, options) {
  let { x, y, width, height } = el.getBoundingClientRect()
  const clone = el.cloneNode(true)
  clone.id = `${el.id}--ghost`
  clone.classList.add("ghost")
  const styles = getComputedStyle(el)

  if (options?.subpixel !== true) {
    x = Math.round(x)
    y = Math.round(y)
    width = Math.round(width)
    height = Math.round(height)
  }

  const marginTop = Number.parseInt(styles.marginTop, 10)
  const marginLeft = Number.parseInt(styles.marginLeft, 10)

  if (options?.cloneStyles !== false) applyStyleDeclaration(clone, styles)

  clone.style.transition = "none"
  clone.style.position = "fixed"
  clone.style.pointerEvents = "none"
  clone.style.minWidth = "0"
  clone.style.minHeight = "0"
  clone.style.maxWidth = "none"
  clone.style.maxHeight = "none"

  if (clone.style.display === "inline") clone.style.display = "inline-block"

  clone.style.width = `${width}px`
  clone.style.height = `${height}px`
  clone.style.marginTop = marginTop
  clone.style.marginLeft = marginLeft
  clone.style.top = 0
  clone.style.left = 0
  clone.style.translate = `${x}px ${y}px`

  if (options?.area) {
    options.area.marginTop = marginTop
    options.area.marginLeft = marginLeft
    options.area.marginRight = Number.parseInt(styles.marginRight, 10)
    options.area.marginBottom = Number.parseInt(styles.marginBottom, 10)
    options.area.x = x
    options.area.y = y
    options.area.width = width
    options.area.height = height
  }

  return clone
}

ghostify.area = area

export default ghostify
