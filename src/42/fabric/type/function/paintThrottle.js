// @src https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API#example

export default function paintThrottle(fn) {
  let pending = false

  function paint(...args) {
    if (pending) return
    pending = true
    requestAnimationFrame(() => {
      pending = false
      fn(...args)
    })
  }

  return paint
}
