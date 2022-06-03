import renderAttributes from "./renderers/renderAttributes.js"
import parseAbbreviation from "./utils/parseAbbreviation.js"
import { normalizeAttrs } from "./normalize.js"
import SVG_TAGS from "../fabric/constants/SVG_TAGS.js"

export default function create(ctx, tag, ...args) {
  if (typeof ctx === "string") {
    if (tag) args.unshift(tag)
    tag = ctx
    ctx = undefined
  }

  const content = []
  let attrs = { id: undefined } // ensure "id" is the first attribute

  for (const arg of args) {
    if (arg != null) {
      if (typeof arg !== "object" || arg instanceof Node) content.push(arg)
      else if (Array.isArray(arg)) content.push(...arg)
      else Object.assign(attrs, arg)
    }
  }

  const parsed = parseAbbreviation(tag, attrs)
  tag = parsed.tag
  attrs = ctx === undefined ? parsed.attrs : normalizeAttrs(parsed.attrs, ctx)

  const el = SVG_TAGS.includes(tag)
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag)

  renderAttributes(el, ctx, attrs)

  el.append(...content)

  return el
}
