import { setStyle } from "../../fabric/dom/setStyles.js"
// import paintDebounce from "../../fabric/type/function/paintDebounce.js"
import register from "../register.js"

// const cleanup = paintDebounce((el) => {
//   if (el.style.cssText === "") el.removeAttribute("style")
// })

export default function renderStyles(el, ctx, styles) {
  const type = typeof styles
  if (type === "string") {
    el.style.cssText = styles
  } else if (type === "function") {
    register(ctx, styles, (val) => {
      el.style.cssText = val
      // cleanup(el)
    })
  } else {
    for (const [key, val] of styles) {
      if (typeof val === "function") {
        setStyle(el, key, "unset") // placeholder to keep style order
        register(ctx, val, (val) => {
          setStyle(el, key, val)
          // cleanup(el)
        })
      } else {
        setStyle(el, key, val)
        // cleanup(el)
      }
    }
  }
}
