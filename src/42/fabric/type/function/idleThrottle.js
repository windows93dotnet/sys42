if ("requestIdleCallback" in globalThis === false) {
  await import(
    "../../../system/env/polyfills/globalThis.requestIdleCallback.js"
  )
}

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
