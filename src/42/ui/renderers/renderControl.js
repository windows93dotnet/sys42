import register from "../register.js"
import setControlData from "../../fabric/dom/setControlData.js"
import getControlData from "../../fabric/dom/getControlData.js"
import setAttributes from "../../fabric/dom/setAttributes.js"
import create from "../create.js"
import findScope from "../findScope.js"
import resolveScope from "../resolveScope.js"
import basename from "../../fabric/type/path/extract/basename.js"
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
    if ("exclusiveMinimum" in schema) attr.min = schema.exclusiveMinimum + 1
    else if ("minimum" in schema) attr.min = schema.minimum
    if ("exclusiveMaximum" in schema) attr.max = schema.exclusiveMaximum - 1
    else if ("maximum" in schema) attr.max = schema.maximum
  }

  attr.autocomplete = def.autocomplete ?? "off" // opt-in autocomplete

  if (def.prose !== true) {
    attr.autocapitalize = "none"
    attr.autocorrect = "off"
    attr.spellcheck = "false"
    attr.translate = "no"
  }

  return attr
}

export default function renderControl(el, ctx, def) {
  el.id ||= hash(ctx.steps)

  if (def.scope) {
    ctx.scope = ctx.scopeBackup
    ctx.scope = resolveScope(...findScope(ctx, def.scope), ctx)
    el.name ||= ctx.scope

    register(ctx, ctx.scope, (val) => setControlData(el, val))

    def.on ??= []
    def.on.push({
      [def.lazy
        ? def.enterKeyHint === "enter"
          ? "change"
          : "change || Enter"
        : "input"]: () => ctx.reactive.set(el.name, getControlData(el)),
    })
  }

  setAttributes(el, setValidation(def))

  if (def.enterKeyHint && def.enterKeyHint !== "enter") {
    def.on ??= []
    def.on.push({ Enter: `{{${def.enterKeyHint}(target, e)}}` })
  }

  const field =
    el.type === "radio" || el.type === "checkbox"
      ? create(".check-cont")
      : document.createDocumentFragment()

  const labelText =
    def.label ??
    (el.type === "radio"
      ? toTitleCase(el.value)
      : toTitleCase(basename(el.name)))

  if (labelText) {
    el.removeAttribute("label")

    const label = create(ctx, "label", { for: el.id }, labelText)

    if (def.compact === true) label.classList.add("sr-only")

    if (def.required) {
      label.append(
        create("abbr", { "aria-hidden": "true", "title": "Required" }, "*")
      )
    }

    field.append(label)
  }

  field.append(el)

  return field
}
