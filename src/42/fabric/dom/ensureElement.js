const { ELEMENT_NODE } = Node

export default function ensureElement(val, base = document) {
  const type = typeof val
  const el = type === "string" ? base.querySelector(val) : val
  if (el?.nodeType === ELEMENT_NODE) return el

  throw new TypeError(
    `The "el" argument must be an element or a valid css selector: ${
      type === "string" ? val : type
    }`
  )
}
