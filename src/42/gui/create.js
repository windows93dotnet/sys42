// import renderAttributes from "./renderers/renderAttributes.js"
import parseAbbreviation from "./utils/parseAbbreviation.js"
import SVG_TAGS from "../fabric/constants/SVG_TAGS.js"

export default function create(ctx, tagName, ...args) {
  if (typeof ctx === "string") {
    if (tagName) args.unshift(tagName)
    tagName = ctx
    ctx = undefined
  }

  const parsed = parseAbbreviation(tagName)
  tagName = parsed.tag

  const el = SVG_TAGS.includes(tagName)
    ? document.createElementNS("http://www.w3.org/2000/svg", tagName)
    : document.createElement(tagName)

  // renderAttributes(el, ctx, parsed.attrs)

  for (const arg of args) {
    if (arg !== undefined) {
      if (typeof arg !== "object" || arg instanceof Node) el.append(arg)
      else if (Array.isArray(arg)) el.append(...arg)
      // else renderAttributes(el, ctx, arg)
    }
  }

  return el
}
