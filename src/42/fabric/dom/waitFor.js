import TimeoutError from "../errors/TimeoutError.js"

function cleanup(intervalID, timeoutID) {
  clearInterval(intervalID)
  clearTimeout(timeoutID)
}

/**
 * Waits for a CSS selector to be present
 * @param {string} selector CSS selector
 * @param {object} [options]
 * @param {HTMLElement} [options.base] Base element, defaults to document.documentElement
 * @param {boolean} [options.all=false] Returns array of all matching elements if true
 * @param {number} [options.timeout=3000] Fail timeout in milliseconds
 * @param {number} [options.polling=100] Number of retries
 * @param {AbortSignal} [options.signal] Abort signal
 * @returns {Promise<Element | Element[]>}
 */
export default async function waitFor(selector, options) {
  const timeout = options?.timeout ?? 3000
  const polling = options?.polling ?? 100
  const base = options?.base ?? document.documentElement

  if (options?.all) {
    const res = base.querySelectorAll(`:scope ${selector}`)
    if (res.length > 0) return [...res]
  } else {
    return base.querySelector(`:scope ${selector}`)
  }

  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      if (options?.signal?.aborted) {
        cleanup(intervalId, timeoutId)
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
        cleanup(intervalId, timeoutId)
        resolve(el)
      }
    }, polling)

    const timeoutId = setTimeout(() => {
      cleanup(intervalId, timeoutId)
      reject(
        new TimeoutError(
          `Waiting for "${selector}" selector timed out: ${timeout}ms`,
        ),
      )
    }, timeout)
  })
}
