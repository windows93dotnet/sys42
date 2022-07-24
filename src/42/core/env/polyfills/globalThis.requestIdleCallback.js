// @src https://github.com/behnammodi/polyfill/blob/master/window.polyfill.js

globalThis.sys42 ??= { polyfills: [] }
globalThis.sys42.polyfills.push("globalThis.requestIdleCallback")

globalThis.requestIdleCallback = function (callback, options = {}) {
  const relaxation = 1
  const timeout = options.timeout || relaxation
  const start = performance.now()
  return setTimeout(() => {
    callback({
      get didTimeout() {
        return options.timeout
          ? false
          : performance.now() - start - relaxation > timeout
      },
      timeRemaining() {
        return Math.max(0, relaxation + (performance.now() - start))
      },
    })
  }, relaxation)
}

globalThis.cancelIdleCallback = function (id) {
  clearTimeout(id)
}
