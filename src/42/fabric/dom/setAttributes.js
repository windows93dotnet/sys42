/* eslint-disable complexity */
import uid from "../../fabric/uid.js"
import setStyles from "./setStyles.js"

export function setDataset(el, obj) {
  for (const [key, val] of Object.entries(obj)) {
    el.setAttribute(`data-${key}`, val)
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

// [1] SVG doesn't support `className` // TODO: check browser compatibility
export function setClasses(el, val) {
  if (Array.isArray(val)) el.setAttribute("class", val.join(" ") /* [1] */)
  else {
    const type = typeof val
    if (type === "string") el.setAttribute("class", val /* [1] */)
    else if (val && type === "object") {
      for (const [keys, value] of Object.entries(val)) {
        const op = value ? "add" : "remove"
        for (const key of keys.split(" ")) el.classList[op](key)
      }
    }
  }

  return el
}

export function setAttribute(el, key, val) {
  if (key === "class" || key === "className") {
    if (val) setClasses(el, val)
    else el.removeAttribute("class")
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
    if (el.localName === "textarea" || el.localName === "select") {
      el.value = val == null ? null : val
    } else if (val == null) el.toggleAttribute(key, false)
    else el.setAttribute("value", val)
  } else if (key === "aria") {
    setAriaAttributes(el, val)
  } else if (key.startsWith("aria-")) {
    setAriaAttribute(el, key, val)
  } else if (key !== "childs") {
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

// [1] throw if setting value on input[type="file"]
export default function setAttributes(el, obj) {
  if (!obj) return el

  for (const [keys, val] of Object.entries(obj)) {
    for (const key of keys.split(" ")) setAttribute(el, key, val)
  }

  return el
}
