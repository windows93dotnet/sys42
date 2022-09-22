//! Copyright (c) 2012-2018 The Debounce Contributors [1]. MIT License.
//! [1] https://github.com/component/debounce/blob/master/CONTRIBUTORS
// @src https://github.com/component/debounce

export default function debounce(fn, ms = 100, immediate = false) {
  if (typeof ms === "object") {
    const options = ms
    ms = options.wait ?? 100
    immediate = options.immediate ?? false
  } else if (ms === true) {
    ms = 100
  }

  let timeout
  let args
  let timestamp
  let result

  const later = () => {
    const last = Date.now() - timestamp
    if (last < ms && last >= 0) {
      timeout = setTimeout(later, ms - last)
    } else {
      timeout = undefined
      if (!immediate) {
        result = fn(...args)
        args.length = 0
        args = undefined
      }
    }
  }

  function debounced(...rest) {
    args = rest
    timestamp = Date.now()
    const callNow = immediate && !timeout
    if (!timeout) timeout = setTimeout(later, ms)
    if (callNow) {
      result = fn(...args)
      args.length = 0
      args = undefined
    }

    return result
  }

  debounced.clear = () => {
    if (!timeout) return
    clearTimeout(timeout)
    timeout = undefined
  }

  debounced.flush = () => {
    if (!timeout) return result
    result = fn(...args)
    args.length = 0
    args = undefined
    clearTimeout(timeout)
    timeout = undefined
    return result
  }

  return debounced
}
