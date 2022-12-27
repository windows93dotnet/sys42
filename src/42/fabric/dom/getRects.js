const keys = ["x", "y", "width", "height", "top", "right", "bottom", "left"]

export async function getRects(elements, options) {
  const root = options?.root ?? document.documentElement

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
            const rect = Object.create(null)
            rect.target = target
            rects.push(rect)
            for (const key of keys) {
              rect[key] = boundingClientRect[key]
            }

            rect.left -= rootX
            rect.top -= rootY
            rect.right -= rootX
            rect.bottom -= rootY

            rect.x = rect.left
            rect.y = rect.top
          }
        } else {
          for (const { target, boundingClientRect } of entries) {
            const rect = Object.create(null)
            rect.target = target
            rects.push(rect)
            for (const key of keys) {
              rect[key] = boundingClientRect[key]
            }
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
