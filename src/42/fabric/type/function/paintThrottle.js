// @src https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API#example
// @read https://stackoverflow.com/a/44700302

export default function paintThrottle(fn) {
  let pending = false
  return (...args) => {
    if (pending) return
    pending = true
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fn(...args)
        pending = false
      })
    })
  }
}
