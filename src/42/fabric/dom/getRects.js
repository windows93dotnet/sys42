export async function getRects(elements, options) {
  const root = options?.root ?? document.scrollingElement

  if (typeof elements === "string") {
    elements = root.querySelectorAll(elements)
  }

  return new Promise((resolve) => {
    const rects = []

    const observer = new IntersectionObserver(
      (entries) => {
        if (options?.relative) {
          const rootRect = root.getBoundingClientRect()
          const { borderLeftWidth, borderTopWidth } = getComputedStyle(root)
          rootRect.x += Number.parseInt(borderLeftWidth, 10) - root.scrollLeft
          rootRect.y += Number.parseInt(borderTopWidth, 10) - root.scrollTop

          for (const { target, boundingClientRect } of entries) {
            const rect = boundingClientRect.toJSON()
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
          for (const { target, boundingClientRect } of entries) {
            const rect = boundingClientRect.toJSON()
            rect.target = target
            rects.push(rect)
          }
        }

        resolve(rects)
        observer.disconnect()
      },
      options?.root ? { root } : undefined
    )

    for (const el of elements) observer.observe(el)
  })
}

export default getRects
