if ("requestIdleCallback" in globalThis === false) {
  await import("../../../core/env/polyfills/globalThis.requestIdleCallback.js")
}

export function idleDebounce(fn) {
  let id

  const debounced = (...args) => {
    cancelIdleCallback(id)
    id = requestIdleCallback(() => fn(...args))
  }

  debounced.originalFn = fn
  return debounced
}

export default idleDebounce
