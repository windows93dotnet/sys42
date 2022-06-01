export default function paintDebounce(fn) {
  let id
  return (...args) => {
    cancelAnimationFrame(id)
    id = requestAnimationFrame(() => fn(...args))
  }
}
