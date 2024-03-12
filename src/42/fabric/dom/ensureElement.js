import getType from "../type/any/getType.js"

const { ELEMENT_NODE } = Node

/**
 * Returns an `HTMLElement` from the input value if it's an element or a CSS selector for an exsiting element.\
 * Throws a `TypeError` otherwise.
 *
 * @param {string | HTMLElement} val
 * @param {HTMLElement} [base=document] Default is `document`
 * @returns {HTMLElement}
 */
export default function ensureElement(val, base = document) {
  const type = typeof val
  const el = type === "string" ? base.querySelector(val) : val

  if (el?.nodeType === ELEMENT_NODE) return el

  throw new TypeError(
    `Input value must be an element or a CSS selector for an exsiting element: ${
      type === "string" //
        ? val
        : getType(val)
    }`,
  )
}
