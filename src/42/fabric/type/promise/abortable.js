// @src https://jakearchibald.com/2020/events-and-gc/

export function abortable(signal, promise) {
  if (signal.aborted) throw signal.reason
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason))
    }),
  ])
}

export default abortable
