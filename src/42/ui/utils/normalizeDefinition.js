/* eslint-disable max-depth */
import { toKebabCase } from "../../fabric/type/string/letters.js"
import parseAbbreviation from "./parseAbbreviation.js"

import { TRAITS } from "../renderers/renderTraits.js"
import ATTRIBUTES_ALLOW_LIST from "../../fabric/constants/ATTRIBUTES_ALLOW_LIST.js"

const ATTRIBUTES = new Set(ATTRIBUTES_ALLOW_LIST.concat(["dataset", "aria"]))

const DEF_KEYWORDS = new Set([
  "actions",
  "args",
  "bind",
  "compact",
  "content",
  "data",
  "dialog",
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
  ...TRAITS,
])

export default function normalizeDefinition(...args) {
  let ctx = {}
  const def = {}
  const attrs = {}
  const rest = {}

  const content = []

  for (const arg of args) {
    if (typeof arg === "string") content.push(arg)
    else if (Array.isArray(arg)) content.push(...arg)
    else if ("global" in arg && "scope" in arg && "cancel" in arg) ctx = arg
    else {
      for (const [key, val] of Object.entries(arg)) {
        if (key === "content") {
          if (Array.isArray(val)) content.push(...val)
          else content.push(val)
        } else if (key === "ctx") ctx = val
        else if (DEF_KEYWORDS.has(key)) def[key] = val
        else if (ATTRIBUTES.has(toKebabCase(key.toLowerCase()))) {
          attrs[key] = val
        } else {
          rest[key] = val
        }
      }
    }
  }

  if (def.type) {
    const parsed = parseAbbreviation(def.type, attrs)
    def.type = parsed.tag
  }

  if (content.length > 0) def.content = content

  return { def, ctx, attrs, rest }
}
