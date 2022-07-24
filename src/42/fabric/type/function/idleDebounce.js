if ("requestIdleCallback" in globalThis === false) {
  await import("../../../core/env/polyfills/globalThis.requestIdleCallback.js")
}

export default function idleDebounce(fn) {
  let id
  return (...args) => {
    cancelIdleCallback(id)
    id = requestIdleCallback(() => fn(...args))
  }
}
