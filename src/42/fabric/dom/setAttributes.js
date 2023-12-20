/* eslint-disable complexity */
import uid from "../../core/uid.js"
import setStyles from "./setStyles.js"
import setClasses from "./setClasses.js"
import toKebabCase from "../type/string/case/toKebabCase.js"

export function setDataset(el, obj) {
  for (const [key, val] of Object.entries(obj)) {
    el.setAttribute(`data-${toKebabCase(key)}`, val)
  }

  return el
}

export function setAriaAttribute(el, key, val) {
  if (val === undefined) el.removeAttribute(key)
  else el.setAttribute(key, String(val))
}

export function setAriaAttributes(el, obj) {
  for (const [key, val] of Object.entries(obj)) {
    setAriaAttribute(el, `aria-${key}`, val)
  }

  return el
}

export function setAttribute(el, key, val, options) {
  if (key === "class") {
    if (val) setClasses(el, val, options)
    else el.setAttribute("class", "") // preserve attribute order for testing
  } else if (key === "style") {
    if (val) setStyles(el, val)
    else el.removeAttribute(key)
  } else if (key === "dataset") {
    setDataset(el, val)
  } else if (key === "role") {
    if (val === undefined) el.removeAttribute(key)
    else el.setAttribute(key, val)
  } else if (key === "id") {
    if (val) {
      if (val === true) {
        if (!el.id) el.setAttribute(key, uid())
      } else el.setAttribute(key, val)
    } else el.removeAttribute(key)
  } else if (key === "value") {
    if (val == null) el.toggleAttribute(key, false)
    el.value = val == null ? null : val
  } else if (key === "aria") {
    setAriaAttributes(el, val)
  } else if (key.startsWith("aria-")) {
    setAriaAttribute(el, key, val)
  } else {
    const type = typeof val
    if (type === "boolean" || val === undefined) {
      val = Boolean(val)
      if (typeof el[key] === "boolean") el[key] = val
      else el.toggleAttribute(key, val)
    } else if (type === "function") {
      el[key] = (e) => {
        if (val(e) === false) {
          e.preventDefault()
          return false
        }
      }
    } else {
      el.setAttribute(key, val)
    }
  }

  return el
}

export function setAttributes(el, obj, options) {
  if (!obj) return el

  for (const [keys, val] of Object.entries(obj)) {
    for (const key of keys.split(" ")) setAttribute(el, key, val, options)
  }

  return el
}

export default setAttributes
