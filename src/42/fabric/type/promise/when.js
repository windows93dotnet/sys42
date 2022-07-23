import normalizeError from "../error/normalizeError.js"

const OR_REGEX = /\s*(\|\||&&|\+)\s*/

export default async function when(target, events, options) {
  if (typeof target === "string") {
    options = events
    events = target
    target = globalThis
  }

  let { race, error, signal } = options ?? {}

  const controller = new AbortController()
  const listenerOptions = { signal: controller.signal, once: true }
  let originStack

  race ??= events.includes("||")
  if (error === true) error = "error"
  if (error) originStack = new Error().stack

  return Promise[race ? "race" : "all"](
    events.split(OR_REGEX).map(
      (event) =>
        new Promise((resolve, reject) => {
          function onevent(e) {
            resolve(e)
            controller.abort()
          }

          function onerror(e) {
            reject(normalizeError(e, originStack))
            controller.abort()
          }

          target.addEventListener(event, onevent, listenerOptions)
          if (error) target.addEventListener(error, onerror, listenerOptions)
          signal?.addEventListener("abort", onerror)
        })
    )
  )
}
