import { setAttribute } from "../../fabric/dom/setAttributes.js"
import { setStyle } from "../../fabric/dom/setStyles.js"
import setControlData from "../../fabric/dom/setControlData.js"
import toKebabCase from "../../fabric/type/string/case/toKebabCase.js"
import register from "../register.js"

function renderClasses(el, stage, classes) {
  if (Array.isArray(classes)) {
    return void el.setAttribute("class", classes.join(" "))
  }

  for (const [keys, val] of Object.entries(classes)) {
    if (typeof val === "function") {
      register(stage, val, (val) => {
        const op = val ? "add" : "remove"
        for (const key of keys.split(" ")) el.classList[op](key)
      })
    } else {
      const op = val ? "add" : "remove"
      for (const key of keys.split(" ")) el.classList[op](key)
    }
  }
}

function renderStyles(el, stage, styles) {
  const type = typeof styles
  if (type === "string") {
    el.style = styles
  } else if (type === "function") {
    register(stage, styles, (val) => {
      el.style = val
    })
  } else {
    for (const [key, val] of Object.entries(styles)) {
      if (typeof val === "function") {
        setStyle(el, key, "unset") // placeholder to keep style order
        register(stage, val, (val) => setStyle(el, key, val))
      } else {
        setStyle(el, key, val)
      }
    }
  }
}

function applySize(attrs, key) {
  attrs.style ??= {}
  attrs.style[key] = attrs[key]
  delete attrs[key]
}

export function renderAttributes(el, stage, attrs, prefix = "") {
  if ("height" in attrs && "height" in el === false) applySize(attrs, "height")
  if ("width" in attrs && "width" in el === false) applySize(attrs, "width")

  for (let [key, val] of Object.entries(attrs)) {
    if (key === "autofocus") key = "data-autofocus" // prevent use of restricted autofocus attribute

    if (key === "dataset") renderAttributes(el, stage, val, "data-")
    else if (key === "aria") renderAttributes(el, stage, val, "aria-")
    else if (key === "style") renderStyles(el, stage, val)
    else if (key === "class" && val && typeof val === "object") {
      renderClasses(el, stage, val)
    } else if (key === "value" && el.form !== undefined) {
      if (typeof val === "function") {
        register(stage, val, async (val) => setControlData(el, await val))
      } else {
        setControlData(el, val)
      }
    } else {
      key = prefix + (prefix === "data-" ? toKebabCase(key) : key)
      if (typeof val === "function") {
        register(stage, val, async (val) => setAttribute(el, key, await val))
      } else {
        setAttribute(el, key, val)
      }
    }
  }
}

export default renderAttributes
