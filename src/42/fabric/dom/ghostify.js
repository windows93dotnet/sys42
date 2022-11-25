export function ghostify(el) {
  const { x, y, width, height } = el.getBoundingClientRect()
  const clone = el.cloneNode(true)
  clone.id = `${el.id}_clone`
  const styles = getComputedStyle(el)

  clone.style.width = width
  clone.style.height = height

  const marginTop = Number.parseInt(styles.marginTop, 10)
  const marginLeft = Number.parseInt(styles.marginLeft, 10)

  clone.style.position = "fixed"
  clone.style.pointerEvents = "none"
  clone.style.top = `${y - marginTop}px`
  clone.style.left = `${x - marginLeft}px`

  return clone
}

export default ghostify
