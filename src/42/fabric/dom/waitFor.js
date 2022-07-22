function cleanup(intervalID, timeoutID) {
  clearInterval(intervalID)
  clearTimeout(timeoutID)
}

export default async function waitFor(selector, options) {
  const timeout = options?.timeout ?? 5000
  const polling = options?.polling ?? 100
  const parent = options?.parent ?? document.body

  return new Promise((resolve, reject) => {
    const intervalID = setInterval(() => {
      if (options?.signal?.aborted) {
        cleanup(intervalID, timeoutID)
        reject(options.signal.reason)
      }

      const el = parent.querySelector(`:scope ${selector}`)
      if (el) {
        cleanup(intervalID, timeoutID)
        resolve(el)
      }
    }, polling)

    const timeoutID = setTimeout(() => {
      cleanup(intervalID, timeoutID)
      reject(new Error(`wait for "${selector}" timed out`))
    }, timeout)
  })
}
