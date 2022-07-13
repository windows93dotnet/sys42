import renderAttributes from "./renderers/renderAttributes.js"
import parseTagSelector from "../system/formats/emmet/parseTagSelector.js"
import { normalizeAttrs } from "./normalize.js"
import ALLOWED_SVG_ATTRIBUTES from "../fabric/constants/ALLOWED_SVG_ATTRIBUTES.js"

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

  const inBody = ctx?.el?.localName === "body"

  const parsed = parseTagSelector(tag, attrs)
  tag = parsed.tag

  const el = ALLOWED_SVG_ATTRIBUTES.includes(tag)
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : tag === "body"
    ? document.createDocumentFragment()
    : document.createElement(tag)

  attrs = ctx === undefined ? parsed.attrs : normalizeAttrs(parsed.attrs, ctx)
  if (attrs.id === undefined) delete attrs.id
  renderAttributes(
    tag === "body" ? (inBody ? ctx.el : document.body) : el,
    ctx,
    attrs
  )

  el.append(...content)

  return el
}
