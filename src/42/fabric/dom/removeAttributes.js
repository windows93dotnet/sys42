/* eslint-disable complexity */
/* eslint-disable max-depth */
import isHashmapLike from "../type/any/is/isHashmapLike.js"
import arrify from "../type/any/arrify.js"
import cssPrefix from "../cssom/cssPrefix.js"

/**
 * Remove attributes from an element.
 *
 * @param {HTMLElement | SVGElement} el
 * @param {object} obj An object with attribute names as keys.
 * @param {object} [options]
 * @param {boolean} [options.flipBoolean=false] Default is `false`
 * @returns {Element}
 */
export function removeAttributes(el, obj, options) {
  if (!obj) return el

  for (const [keys, val] of Object.entries(obj)) {
    for (const key of keys.split(" ")) {
      if (key === "class") {
        if (isHashmapLike(val)) {
          for (const [key, value] of Object.entries(val)) {
            if (value === true) el.classList.remove(key)
          }
        } else el.classList.remove(...arrify(val))
      } else if (key === "aria") {
        const isArray = Array.isArray(val)
        if (!isArray && options?.flipBoolean === true) {
          for (const [key, value] of Object.entries(val)) {
            el.setAttribute(`aria-${key}`, String(!value))
          }
        } else {
          const list = isArray ? val : Object.keys(val)
          for (const key of list) {
            el.removeAttribute(`aria-${key}`)
          }
        }
      } else if (key === "dataset") {
        const list = Array.isArray(val) ? val : Object.keys(val)
        for (const key of list) {
          el.removeAttribute(`data-${key}`)
        }
      } else if (key === "style") {
        const list = Array.isArray(val) ? val : Object.keys(val)
        for (const key of list) {
          const prefixed = cssPrefix(key)
          if (prefixed && prefixed in el.style) el.style[prefixed] = ""
          if (key in el.style) el.style[key] = ""
        }
      } else {
        el.removeAttribute(key)
      }
    }
  }

  return el
}

export default removeAttributes
