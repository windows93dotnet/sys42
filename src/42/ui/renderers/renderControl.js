import register from "../register.js"
import setControlData from "../../fabric/dom/setControlData.js"
import getControlData from "../../fabric/dom/getControlData.js"
import setAttributes from "../../fabric/dom/setAttributes.js"
import create from "../create.js"
import findScope from "../findScope.js"
import resolveScope from "../resolveScope.js"
import { toTitleCase } from "../../fabric/type/string/letters.js"
import hash from "../../fabric/type/any/hash.js"

function setValidation(def) {
  const attr = {}
  if (def.required) attr.required = true
  if (def.schema) {
    const { schema } = def
    // string
    if ("pattern" in schema) attr.pattern = schema.pattern
    if ("minLength" in schema) attr.minLength = schema.minLength
    if ("maxLength" in schema) attr.maxLength = schema.maxLength

    // number
    if ("multipleOf" in schema) attr.step = schema.multipleOf
    if ("minimum" in schema) attr.min = schema.minimum
    if ("maximum" in schema) attr.max = schema.maximum
    if ("exclusiveMinimum" in schema) attr.min = schema.exclusiveMinimum + 1
    if ("exclusiveMaximum" in schema) attr.max = schema.exclusiveMaximum - 1
  }

  attr.autocomplete = "off"

  if (def.prose === false) {
    attr.autocapitalize = "none"
    attr.autocorrect = "off"
    attr.spellcheck = "false"
    attr.translate = "no"
  }

  return attr
}

export default function renderControl(el, ctx, def) {
  ctx.scope = ctx.scopeBackup
  ctx.scope = resolveScope(...findScope(ctx, def.scope), ctx)

  el.name ||= ctx.scope
  el.id ||= hash(ctx.steps)

  setAttributes(el, setValidation(def))

  register(ctx, ctx.scope, (val) => setControlData(el, val))

  def.on ??= []
  def.on.push({ input: () => ctx.reactive.set(el.name, getControlData(el)) })

  // const field = create("fieldset", {
  //   role: "none",
  //   ...def.fieldset,
  // })

  const field =
    el.type === "radio" || el.type === "checkbox"
      ? create(".check-cont")
      : document.createDocumentFragment()

  const label = create(
    "label",
    { for: el.id },
    def.label ?? el.type === "radio"
      ? toTitleCase(el.value)
      : toTitleCase(def.scope)
  )

  if (def.compact === true) label.classList.add("sr-only")

  if (def.required) {
    label.append(
      create("abbr", { "aria-hidden": "true", "title": "Required" }, "*")
    )
  }

  field.append(label, el)
  return field
}
