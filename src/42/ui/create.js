import renderAttributes from "./renderers/renderAttributes.js"
import parseTagSelector from "../core/formats/emmet/parseTagSelector.js"
import { normalizeAttrs } from "./normalize.js"
import ALLOWED_SVG_ATTRIBUTES from "../fabric/constants/ALLOWED_SVG_ATTRIBUTES.js"

const INPUT_TYPES = new Set([
  "checkbox",
  "color",
  "date",
  "datetime-local",
  "email",
  "file",
  "month",
  "number",
  "password",
  "radio",
  "range",
  "search",
  "tel",
  "text",
  "time",
  "url",
  "week",
])

const BUTTON_TYPES = new Set([
  "button", //
  "reset",
  "submit",
])

const ATTRIBUTES_ORDER = ["id", "class"]

export default function create(ctx, tag, ...args) {
  if (typeof ctx === "string") {
    if (tag) args.unshift(tag)
    tag = ctx
    ctx = undefined
  }

  const content = []
  let attrs = {}

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

  if (BUTTON_TYPES.has(tag)) {
    attrs.type = tag
    tag = "button"
  } else if (INPUT_TYPES.has(tag)) {
    attrs.type = tag
    tag = "input"
  }

  const el = ALLOWED_SVG_ATTRIBUTES.includes(tag)
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : tag === "body"
    ? document.createDocumentFragment()
    : document.createElement(tag)

  // sort attributes
  const tmp = {}
  for (const key of ATTRIBUTES_ORDER) if (key in attrs) tmp[key] = attrs[key]
  attrs = Object.assign(tmp, attrs)

  renderAttributes(
    tag === "body" ? (inBody ? ctx.el : document.body) : el,
    ctx,
    ctx === undefined ? attrs : normalizeAttrs(attrs, ctx)
  )

  el.append(...content)

  return el
}
