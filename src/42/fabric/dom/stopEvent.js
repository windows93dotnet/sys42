export default function stopEvent(e) {
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()
}
