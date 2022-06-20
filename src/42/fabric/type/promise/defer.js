export default function defer() {
  const deferred = Object.create(null)

  deferred.isPending = true
  deferred.isRejected = false
  deferred.isResolved = false

  const promise = new Promise((resolve, reject) => {
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

  deferred.promise = promise

  deferred.then = (resolve, reject) => promise.then(resolve, reject)

  return deferred
}
