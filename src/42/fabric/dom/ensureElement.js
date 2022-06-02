const { ELEMENT_NODE, DOCUMENT_FRAGMENT_NODE } = Node

export default function ensureElement(el, options) {
  const type = typeof el

  if (type === "string") el = document.querySelector(el)

  if (
    el?.nodeType === ELEMENT_NODE ||
    (options?.fragment && el?.nodeType === DOCUMENT_FRAGMENT_NODE)
  ) {
    return el
  }

  throw new TypeError(
    `The "el" argument must be an element or valid css selector: ${
      type === "string" ? el : type
    }`
  )
}
