function cleanup(intervalID, timeoutID) {
  clearInterval(intervalID)
  clearTimeout(timeoutID)
}

export default async function waitFor(selector, options) {
  const timeout = options?.timeout ?? 3000
  const polling = options?.polling ?? 100
  const base = options?.base ?? document.body

  return new Promise((resolve, reject) => {
    const intervalID = setInterval(() => {
      if (options?.signal?.aborted) {
        cleanup(intervalID, timeoutID)
        reject(options.signal.reason)
      }

      const el = base.querySelector(`:scope ${selector}`)
      if (el) {
        cleanup(intervalID, timeoutID)
        resolve(el)
      }
    }, polling)

    const timeoutID = setTimeout(() => {
      cleanup(intervalID, timeoutID)
      reject(new Error(`Waiting for "${selector}" selector timed out`))
    }, timeout)
  })
}
