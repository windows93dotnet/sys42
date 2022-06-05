import normalizeError from "../error/normalizeError.js"

export default async function when(
  target,
  events,
  { race, error, signal } = {}
) {
  const controller = new AbortController()
  const options = { signal: controller.signal, once: true }

  return Promise[race ? "race" : "all"](
    events.split(" ").map(
      (event) =>
        new Promise((resolve, reject) => {
          function onevent(e) {
            resolve(e)
            controller.abort()
          }

          function onerror(e) {
            reject(normalizeError(e))
            controller.abort()
          }

          target.addEventListener(event, onevent, options)
          if (error) target.addEventListener(error, onerror, options)
          signal?.addEventListener("abort", onerror, options)
        })
    )
  )
}
