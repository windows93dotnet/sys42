/* eslint-disable max-depth */
import { TRAITS } from "../renderers/renderTraits.js"
import ATTRIBUTES_ALLOW_LIST from "../../fabric/constants/ATTRIBUTES_ALLOW_LIST.js"

const ATTRIBUTES = new Set(
  ATTRIBUTES_ALLOW_LIST.concat([
    "dataset",
    "aria",
    // TODO: add SVG_ATTRIBUTES_ALLOW_LIST
    "viewbox",
  ])
)
const ATTRIBUTES_WITHDASH = new Set(["acceptCharset", "httpEquiv"])

const DEF_KEYWORDS = new Set([
  "actions",
  "args",
  "bind",
  "compact",
  "computed",
  "content",
  "data",
  "dialog",
  "filters",
  "label",
  "name",
  "picto",
  "popup",
  "prose",
  "repeat",
  "run",
  "schema",
  "scope",
  "shortcuts",
  "type",
  "when",
])

export default function normalizeDefinition(...args) {
  const { props: properties, defaults } = args[0]

  let ctx = {}
  const def = { traits: {} }
  const attrs = {}
  const props = {}
  const options = {}

  const content = []

  for (const arg of args) {
    if (typeof arg === "string") content.push(arg)
    else if (Array.isArray(arg)) content.push(...arg)
    else if ("global" in arg && "scope" in arg && "cancel" in arg) ctx = arg
    else {
      for (const [key, val] of Object.entries(arg)) {
        if (properties && key in properties) props[key] = val
        else if (defaults && key in defaults) options[key] = val
        else if (TRAITS.includes(key)) def.traits[key] = val
        else if (key === "content") {
          if (Array.isArray(val)) content.push(...val)
          else content.push(val)
        } else if (key === "ctx") ctx = val
        else if (DEF_KEYWORDS.has(key)) def[key] = val
        else if (
          ATTRIBUTES.has(key.toLowerCase()) ||
          ATTRIBUTES_WITHDASH.has(key)
        ) {
          attrs[key] = val
        }
      }
    }
  }

  if (content.length > 0) def.content = content

  return { def, ctx, attrs, props, options }
}
