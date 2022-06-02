import renderAttributes from "./renderers/renderAttributes.js"
import parseAbbreviation from "./utils/parseAbbreviation.js"
import { normalizeAttrs } from "./normalize.js"
import SVG_TAGS from "../fabric/constants/SVG_TAGS.js"

function argsToEntries(obj) {
  return Object.entries(obj)
}

export default function create(ctx, tag, ...args) {
  let makeArgs
  if (typeof ctx === "string") {
    if (tag) args.unshift(tag)
    tag = ctx
    ctx = undefined
    makeArgs = argsToEntries
  } else {
    makeArgs = normalizeAttrs
  }

  const content = []
  const attrs = { id: undefined } // allways make id the first attribute

  for (const arg of args) {
    if (arg !== undefined) {
      if (typeof arg !== "object" || arg instanceof Node) content.push(arg)
      else if (Array.isArray(arg)) content.push(...arg)
      else Object.assign(attrs, arg)
    }
  }

  const parsed = parseAbbreviation(tag, attrs)
  tag = parsed.tag

  const el = SVG_TAGS.includes(tag)
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag)

  renderAttributes(el, ctx, makeArgs(parsed.attrs, ctx))

  el.append(...content)

  return el
}
