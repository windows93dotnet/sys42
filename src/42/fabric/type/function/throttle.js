// MIT License.
// @src https://github.com/component/throttle

export function throttle(fn, wait = 60) {
  let args
  let result
  let id
  let last = 0

  const call = () => {
    id = undefined
    last = Date.now()
    result = fn(...args)
    args.length = 0
    args = undefined
  }

  const throttled = (...rest) => {
    args = rest
    if (!id) {
      const delta = Date.now() - last
      if (delta >= wait) call()
      else id = setTimeout(call, wait - delta)
    }

    return result
  }

  throttled.clear = () => {
    clearTimeout(id)
    id = undefined
  }

  throttled.originalFn = fn
  return throttled
}

export default throttle
