import normalizeError from "../error/normalizeError.js"

const OR_REGEX = /\s*(\|\||&&|\+)\s*/

export default async function when(
  target,
  events,
  { race, error, signal } = {}
) {
  const controller = new AbortController()
  const options = { signal: controller.signal, once: true }
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

          target.addEventListener(event, onevent, options)
          if (error) target.addEventListener(error, onerror, options)
          signal?.addEventListener("abort", onerror)
        })
    )
  )
}
