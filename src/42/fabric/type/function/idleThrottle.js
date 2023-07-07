if ("requestIdleCallback" in globalThis === false) {
  await import("../../../core/env/polyfills/globalThis.requestIdleCallback.js")
}

export default function idleThrottle(fn, timeout) {
  let id
  let pending = false

  const throttled = (...args) => {
    if (pending) return
    pending = true
    id = requestIdleCallback(
      () => {
        fn(...args)
        pending = false
      },
      { timeout },
    )
  }

  throttled.clear = () => {
    cancelIdleCallback(id)
    pending = false
  }

  return throttled
}
