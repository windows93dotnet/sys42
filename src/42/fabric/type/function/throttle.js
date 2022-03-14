// MIT License.
// @src https://github.com/component/throttle

export default function throttle(fn, wait = 60) {
  let args
  let result
  let timeout
  let last = 0

  const call = () => {
    timeout = undefined
    last = Date.now()
    result = fn(...args)
    args.length = 0
    args = undefined
  }

  function throttled(...rest) {
    args = rest
    const delta = Date.now() - last
    if (!timeout) {
      if (delta >= wait) call()
      else timeout = setTimeout(call, wait - delta)
    }

    return result
  }

  throttled.clear = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
  }

  return throttled
}
