export function ghostify(el, options) {
  const { x, y, width, height } = el.getBoundingClientRect()
  const clone = el.cloneNode(true)
  clone.id = `${el.id}--ghost`
  const styles = getComputedStyle(el)

  clone.style.width = width
  clone.style.height = height

  const marginTop = Number.parseInt(styles.marginTop, 10)
  const marginLeft = Number.parseInt(styles.marginLeft, 10)

  clone.style.transition = "none"
  clone.style.position = "fixed"
  clone.style.pointerEvents = "none"
  clone.style.top = `${y - marginTop}px`
  clone.style.left = `${x - marginLeft}px`

  if (options?.carrier) {
    options.carrier.marginTop = marginTop
    options.carrier.marginLeft = marginLeft
    options.carrier.marginRight = Number.parseInt(styles.marginRight, 10)
    options.carrier.marginBottom = Number.parseInt(styles.marginBottom, 10)
    options.carrier.x = x
    options.carrier.y = y
    options.carrier.width = width
    options.carrier.height = height
  }

  return clone
}

export default ghostify
