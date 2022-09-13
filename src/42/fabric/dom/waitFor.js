function cleanup(intervalID, timeoutID) {
  clearInterval(intervalID)
  clearTimeout(timeoutID)
}

export default async function waitFor(selector, options) {
  const timeout = options?.timeout ?? 3000
  const polling = options?.polling ?? 100
  const base = options?.base ?? document.body

  if (options?.all) {
    const res = base.querySelectorAll(`:scope ${selector}`)
    if (res.length > 0) return [...res]
  } else {
    return base.querySelector(`:scope ${selector}`)
  }

  return new Promise((resolve, reject) => {
    const intervalID = setInterval(() => {
      if (options?.signal?.aborted) {
        cleanup(intervalID, timeoutID)
        reject(options.signal.reason)
      }

      let el

      if (options?.all) {
        const res = base.querySelectorAll(`:scope ${selector}`)
        if (res.length > 0) el = [...res]
      } else {
        el = base.querySelector(`:scope ${selector}`)
      }

      if (el) {
        cleanup(intervalID, timeoutID)
        resolve(options?.all ? [...el] : el)
      }
    }, polling)

    const timeoutID = setTimeout(() => {
      cleanup(intervalID, timeoutID)
      reject(new Error(`Waiting for "${selector}" selector timed out`))
    }, timeout)
  })
}
