export default function disposable(make, delay = 1000) {
  let temp
  let id

  return function (...args) {
    temp ??= make(...args)
    clearTimeout(id)
    id = setTimeout(() => {
      temp = undefined // allow garbage collection
    }, delay)
    return temp
  }
}
