const { ELEMENT_NODE } = Node

/**
 * Throws if the value is not an element or a CSS selector for an exsiting element.\
 * Returns the element if valid.
 *
 * @param {string | HTMLElement} value
 * @param {HTMLElement} base
 * @returns {HTMLElement}
 */
export default function ensureElement(value, base = document) {
  const type = typeof value
  const el = type === "string" ? base.querySelector(value) : value

  if (el?.nodeType === ELEMENT_NODE) return el

  throw new TypeError(
    `The "el" argument must be an element or a CSS selector for an exsiting element: ${
      type === "string" //
        ? value
        : value === null
          ? "null"
          : type
    }`,
  )
}
