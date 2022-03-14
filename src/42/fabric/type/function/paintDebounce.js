export default function paintDebounce(fn) {
  let id

  function paint(...args) {
    cancelAnimationFrame(id)
    id = requestAnimationFrame(() => {
      fn(...args)
    })
  }

  return paint
}
