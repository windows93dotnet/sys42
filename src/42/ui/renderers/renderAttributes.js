import { setAttribute } from "../../fabric/dom/setAttributes.js"
import renderStyles from "./renderStyles.js"
import renderKeyVal from "./renderKeyVal.js"

export default function renderAttributes(el, ctx, attrs, prefix = "") {
  for (let [key, val] of Object.entries(attrs)) {
    if (key === "autofocus") key = "data-autofocus" // prevent use of restricted autofocus attribute
    if (key === "dataset") renderAttributes(el, ctx, val, "data-")
    else if (key === "aria") renderAttributes(el, ctx, val, "aria-")
    else if (key === "style") renderStyles(el, ctx, val)
    else renderKeyVal(el, ctx, prefix + key, val, setAttribute)
  }
}
