export function repaintDebounce(fn) {
  let id

  const debounced = (...args) => {
    cancelAnimationFrame(id)
    id = requestAnimationFrame(() => fn(...args))
  }

  debounced.originalFn = fn
  return debounced
}

export default repaintDebounce
