import { setStyle } from "../../fabric/dom/setStyles.js"
import register from "../register.js"

export default function renderStyles(el, ctx, styles) {
  const type = typeof styles
  if (type === "string") {
    el.style.cssText = styles
  } else if (type === "function") {
    register(ctx, styles, (val) => {
      el.style.cssText = val
    })
  } else {
    for (const [key, val] of styles) {
      if (typeof val === "function") {
        setStyle(el, key, "unset") // placeholder to keep style order
        register(ctx, val, (val) => setStyle(el, key, val))
      } else {
        setStyle(el, key, val)
      }
    }
  }
}
