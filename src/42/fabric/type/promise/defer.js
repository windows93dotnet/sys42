import TimeoutError from "../../errors/TimeoutError.js"

export function defer(options) {
  const deferred = Object.create(null)

  deferred.isPending = true
  deferred.isRejected = false
  deferred.isResolved = false

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = (arg) => {
      deferred.isPending = false
      deferred.isResolved = true
      resolve(arg)
    }

    deferred.reject = (err) => {
      deferred.isPending = false
      deferred.isRejected = true
      reject(err)
    }
  })

  deferred.then = (resolve, reject) => deferred.promise.then(resolve, reject)

  const timeout = options?.timeout
  if (timeout) {
    const err =
      typeof options?.timeoutError === "string"
        ? new TimeoutError(options?.timeoutError)
        : options?.timeoutError ?? new TimeoutError(timeout)

    setTimeout(() => {
      if (deferred.isPending) deferred.reject(err)
    }, timeout)
  }

  return deferred
}

export default defer
