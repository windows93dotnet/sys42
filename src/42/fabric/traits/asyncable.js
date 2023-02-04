const _RESOLVED = Symbol("asyncable.RESOLVED")

export default function asyncable(obj, options, fn) {
  if (typeof options === "function") {
    fn = options
    options = undefined
  }

  let init = options?.lazy ? undefined : fn()

  const then = (resolve, reject) => {
    const promise = init ?? fn()
    if (!options?.once) init = undefined

    promise
      .then((res) => {
        obj[_RESOLVED] = true
        resolve(res ?? obj)
        obj[_RESOLVED] = false
      })
      .catch((err) => {
        reject(err)
        obj[_RESOLVED] = false
      })
  }

  Object.defineProperties(obj, {
    [_RESOLVED]: {
      value: false,
      enumerable: false,
      writable: true,
    },
    then: {
      // prevent recursive `then` call
      get: () => (obj[_RESOLVED] ? undefined : then),
    },
  })

  return obj
}
