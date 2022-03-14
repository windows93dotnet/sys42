import renderAttributes from "./renderers/renderAttributes.js"

export default function create(ctx, tagName, ...args) {
  if (typeof ctx === "string") {
    tagName = ctx
    ctx = undefined
  }

  const el = document.createElement(tagName)

  for (const arg of args) {
    if (typeof arg !== "object" || arg instanceof Node) el.append(arg)
    else if (Array.isArray(arg)) el.append(...arg)
    else if (arg) renderAttributes(el, ctx, arg)
  }

  return el
}
