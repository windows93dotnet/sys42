const _RESOLVED = Symbol("asyncable.RESOLVED")

export default function asyncable(obj, options, fn) {
  if (typeof options === "function") {
    fn = options
    options = undefined
  }

  obj[_RESOLVED] = false

  let promise = fn()

  const then = (resolve, reject) =>
    (options?.once ? promise : promise ?? fn())
      .then(() => {
        promise = undefined
        obj[_RESOLVED] = true
        resolve(obj)
        obj[_RESOLVED] = false
      })
      .catch((err) => {
        promise = undefined
        reject(err)
        obj[_RESOLVED] = false
      })

  Object.defineProperty(obj, "then", {
    get: () => (obj[_RESOLVED] ? undefined : then),
  })
}
