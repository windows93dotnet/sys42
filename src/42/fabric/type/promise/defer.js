export default function defer() {
  const deferred = Object.create(null)

  const promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve
    deferred.reject = reject
  })

  deferred.promise = promise

  deferred.then = (resolve, reject) => promise.then(resolve, reject)

  return deferred
}
