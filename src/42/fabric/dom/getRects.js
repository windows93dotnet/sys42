export async function getRects(elements, options) {
  const root = options?.root ?? document

  if (typeof elements === "string") {
    elements = root.querySelectorAll(elements)
  }

  return new Promise((resolve) => {
    const rects = []

    const observer = new IntersectionObserver(
      (entries) => {
        if (options?.relative) {
          let { paddingLeft, paddingTop } = getComputedStyle(root)
          paddingLeft = Number.parseInt(paddingLeft, 10)
          paddingTop = Number.parseInt(paddingTop, 10)

          const { rootBounds } = entries[0]
          const rootX = rootBounds.x - paddingLeft - root.scrollLeft
          const rootY = rootBounds.y - paddingTop - root.scrollTop

          for (const { target, boundingClientRect } of entries) {
            const rect = boundingClientRect.toJSON()
            rect.target = target

            rect.left -= rootX
            rect.top -= rootY
            rect.right -= rootX
            rect.bottom -= rootY

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
      { root }
    )

    for (const el of elements) observer.observe(el)
  })
}

export default getRects
