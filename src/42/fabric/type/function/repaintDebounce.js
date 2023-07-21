export default function repaintDebounce(fn) {
  let id
  return (...args) => {
    cancelAnimationFrame(id)
    id = requestAnimationFrame(() => fn(...args))
  }
}
