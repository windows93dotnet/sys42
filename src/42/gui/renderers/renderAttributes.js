import { setAttribute } from "../../fabric/dom/setAttributes.js"
import renderStyles from "./renderStyles.js"
import register from "../register.js"

export default function renderAttributes(el, ctx, attrs, prefix = "") {
  for (let [key, val] of attrs) {
    if (key === "autofocus") key = "data-autofocus" // prevent use of restricted autofocus attribute

    if (key === "dataset") renderAttributes(el, ctx, val, "data-")
    else if (key === "aria") renderAttributes(el, ctx, val, "aria-")
    else if (key === "style") renderStyles(el, ctx, val)
    else {
      key = prefix + key
      if (typeof val === "function") {
        register(val.keys, ctx, () =>
          setAttribute(el, key, val(ctx.state.proxy))
        )
      } else {
        setAttribute(el, key, val)
      }
    }
  }
}
