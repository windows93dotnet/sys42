export default async function waitFor(selector, options) {
  const timeout = options?.timeout ?? 1000 * 5
  const parent = options?.parent ?? document.body

  return new Promise((resolve, reject) => {
    function cleanup() {
      clearInterval(intervalID)
      clearTimeout(timeoutID)
    }

    const intervalID = setInterval(() => {
      if (options?.signal?.aborted) {
        cleanup()
        reject(options.signal.reason)
      }

      const el = parent.querySelector(`:scope ${selector}`)
      if (el) {
        cleanup()
        resolve(el)
      }
    }, 100)

    const timeoutID = setTimeout(() => {
      cleanup()
      reject(new Error(`wait for "${selector}" timed out`))
    }, timeout)
  })
}
