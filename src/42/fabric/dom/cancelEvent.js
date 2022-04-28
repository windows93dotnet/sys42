export default function cancelEvent(e) {
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()
}
