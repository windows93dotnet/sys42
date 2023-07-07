const { indexOf } = Array.prototype
const { parseInt } = Number
const { round } = Math

function addMargins(target, rect) {
  const { marginTop, marginBottom, marginLeft, marginRight } =
    getComputedStyle(target)

  rect.marginTop = parseInt(marginTop, 10) | 0
  rect.marginBottom = parseInt(marginBottom, 10) | 0
  rect.marginLeft = parseInt(marginLeft, 10) | 0
  rect.marginRight = parseInt(marginRight, 10) | 0
}

function roundSubpixels(rect) {
  rect.left = round(rect.left)
  rect.top = round(rect.top)
  rect.x = rect.left
  rect.y = rect.top
}

export async function getRects(elements, options) {
  if (options?.nodeType === Node.ELEMENT_NODE) options = { root: options }
  const root = options?.root ?? document.scrollingElement

  if (typeof elements === "string") {
    elements = root.querySelectorAll(elements)
  }

  let all
  if (options?.all) {
    all =
      typeof options.all === "string"
        ? root.querySelectorAll(options.all)
        : options.all
  }

  return new Promise((resolve) => {
    const rects = []

    const observer = new IntersectionObserver(
      (entries) => {
        if (options?.relative) {
          const rootRect = root.getBoundingClientRect()
          const { borderLeftWidth, borderTopWidth } = getComputedStyle(root)

          rootRect.x += parseInt(borderLeftWidth, 10) - root.scrollLeft
          rootRect.y += parseInt(borderTopWidth, 10) - root.scrollTop

          for (let i = 0, l = entries.length; i < l; i++) {
            const { target, boundingClientRect, isIntersecting } = entries[i]
            if (options?.intersecting === true && !isIntersecting) continue
            if (options?.intersecting === false && isIntersecting) continue

            const rect = boundingClientRect.toJSON()

            if (options?.includeMargins) addMargins(target, rect)
            if (options?.subpixel !== true) roundSubpixels(rect)

            rect.index = all ? indexOf.call(all, target) : i
            rect.isIntersecting = isIntersecting
            rect.target = target

            rect.left -= rootRect.x
            rect.right -= rootRect.x
            rect.top -= rootRect.y
            rect.bottom -= rootRect.y
            rect.x = rect.left
            rect.y = rect.top

            rects.push(rect)
          }
        } else {
          for (let i = 0, l = entries.length; i < l; i++) {
            const { target, boundingClientRect, isIntersecting } = entries[i]
            if (options?.intersecting === true && !isIntersecting) continue
            if (options?.intersecting === false && isIntersecting) continue

            const rect = boundingClientRect.toJSON()

            if (options?.includeMargins) addMargins(target, rect)
            if (options?.subpixel !== true) roundSubpixels(rect)

            rect.index = all ? indexOf.call(all, target) : i
            rect.isIntersecting = isIntersecting
            rect.target = target

            rects.push(rect)
          }
        }

        resolve(rects)
        observer.disconnect()
      },
      options?.root ? { root } : undefined,
    )

    if (elements.length > 0) for (const el of elements) observer.observe(el)
    else resolve(rects)
  })
}

export default getRects
