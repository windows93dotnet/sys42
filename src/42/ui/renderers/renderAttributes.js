import { setAttribute } from "../../fabric/dom/setAttributes.js"
import { setStyle } from "../../fabric/dom/setStyles.js"
import setControlData from "../../fabric/dom/setControlData.js"
import register from "../register.js"

function renderClasses(el, ctx, classes) {
  if (Array.isArray(classes)) {
    return void el.setAttribute("class", classes.join(" "))
  }

  for (const [keys, val] of Object.entries(classes)) {
    if (typeof val === "function") {
      register(ctx, val, (val) => {
        const op = val ? "add" : "remove"
        for (const key of keys.split(" ")) el.classList[op](key)
      })
    } else {
      const op = val ? "add" : "remove"
      for (const key of keys.split(" ")) el.classList[op](key)
    }
  }
}

function renderStyles(el, ctx, styles) {
  const type = typeof styles
  if (type === "string") {
    el.style = styles
  } else if (type === "function") {
    register(ctx, styles, (val) => {
      el.style = val
    })
  } else {
    for (const [key, val] of Object.entries(styles)) {
      if (typeof val === "function") {
        setStyle(el, key, "unset") // placeholder to keep style order
        register(ctx, val, (val) => setStyle(el, key, val))
      } else {
        setStyle(el, key, val)
      }
    }
  }
}

export default function renderAttributes(el, ctx, attrs, prefix = "") {
  for (let [key, val] of Object.entries(attrs)) {
    if (key === "autofocus") key = "data-autofocus" // prevent use of restricted autofocus attribute

    if (key === "dataset") renderAttributes(el, ctx, val, "data-")
    else if (key === "aria") renderAttributes(el, ctx, val, "aria-")
    else if (key === "style") renderStyles(el, ctx, val)
    else if (key === "class" && val && typeof val === "object") {
      renderClasses(el, ctx, val)
    } else if (key === "value" && el.form !== undefined) {
      if (typeof val === "function") {
        register(ctx, val, async (val) => setControlData(el, await val))
      } else {
        setControlData(el, val)
      }
    } else {
      key = prefix + key
      if (typeof val === "function") {
        register(ctx, val, async (val) => setAttribute(el, key, await val))
      } else {
        setAttribute(el, key, val)
      }
    }
  }
}
