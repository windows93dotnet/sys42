import ensureElement from "./ensureElement.js"

export default function unsee(el) {
  el = ensureElement(el)
  el.style.opacity = 0.01
  el.style.pointerEvents = "none"
  return el
}
