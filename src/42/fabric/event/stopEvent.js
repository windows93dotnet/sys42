export function stopEvent(e) {
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()
}

export default stopEvent
