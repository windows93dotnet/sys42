// @src https://github.com/behnammodi/polyfill/blob/master/window.polyfill.js

window.requestIdleCallback = function (callback, options = {}) {
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

window.cancelIdleCallback = function (id) {
  clearTimeout(id)
}
