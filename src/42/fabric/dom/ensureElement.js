const { ELEMENT_NODE } = Node

export default function ensureElement(val) {
  const type = typeof val

  const el = type === "string" ? document.querySelector(val) : val

  if (el?.nodeType === ELEMENT_NODE) return el

  throw new TypeError(
    `The "el" argument must be an element or valid css selector: ${
      type === "string" ? val : type
    }`
  )
}
