// @src https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API#example
// @read https://stackoverflow.com/a/44700302

export default function paintThrottle(fn) {
  let id
  let pending = false

  const throttled = (...args) => {
    if (pending) return
    pending = true
    id = requestAnimationFrame(() => {
      fn(...args)
      pending = false
    })
  }

  throttled.clear = () => {
    cancelAnimationFrame(id)
    pending = false
  }

  return throttled
}
