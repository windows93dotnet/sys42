export default function idleThrottle(fn, timeout) {
  let pending = false
  return (...args) => {
    if (pending) return
    pending = true
    requestIdleCallback(
      () => {
        fn(...args)
        pending = false
      },
      { timeout }
    )
  }
}
