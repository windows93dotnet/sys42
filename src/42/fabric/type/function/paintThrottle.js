// @src https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API#example

export default function paintThrottle(fn) {
  let pending = false
  return (...args) => {
    if (pending) return
    pending = true
    requestAnimationFrame(() => {
      fn(...args)
      pending = false
    })
  }
}
