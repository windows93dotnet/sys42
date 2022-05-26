const _RESOLVED = Symbol("asyncable.RESOLVED")

export default function asyncable(obj, fn) {
  obj[_RESOLVED] = false

  const then = (resolve, reject) => {
    fn()
      .then(() => {
        obj[_RESOLVED] = true
        resolve(obj)
        obj[_RESOLVED] = false
      })
      .catch((err) => {
        reject(err)
        obj[_RESOLVED] = false
      })
  }

  Object.defineProperty(obj, "then", {
    get: () => (obj[_RESOLVED] ? undefined : then),
  })
}
