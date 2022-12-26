const keys = ["x", "y", "width", "height", "top", "right", "bottom", "left"]

export async function getRects(elements, root = document, options) {
  if (typeof elements === "string") {
    elements = root.querySelectorAll(elements)
  }

  return new Promise((resolve) => {
    const rects = []

    const observer = new IntersectionObserver(
      (entries) => {
        if (options?.relative) {
          for (const { target, boundingClientRect, rootBounds } of entries) {
            const rect = Object.create(null)
            rect.target = target
            rects.push(rect)
            for (const key of keys) {
              rect[key] = boundingClientRect[key]
            }

            rect.x -= rootBounds.x
            rect.y -= rootBounds.y
            rect.right -= rootBounds.x
            rect.bottom -= rootBounds.y
            rect.left = rect.x
            rect.top = rect.y
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
