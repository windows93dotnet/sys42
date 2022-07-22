import register from "../register.js"
import setFieldData from "../../fabric/dom/setFieldData.js"
import getFieldData from "../../fabric/dom/getFieldData.js"
import create from "../create.js"
import { toTitleCase } from "../../fabric/type/string/letters.js"
import hash from "../../fabric/type/any/hash.js"

export default function renderField(el, ctx, def) {
  el.name ||= ctx.scope
  el.id ||= hash(ctx.steps)

  register(ctx, ctx.scope, (val) => setFieldData(el, val))
  def.on ??= [{ input: () => ctx.reactive.set(el.name, getFieldData(el)) }]

  const field = create("fieldset", {
    role: "none",
    ...def.fieldset,
  })

  if (el.type === "radio" || el.type === "checkbox") {
    field.classList.add("check-cont")
  }

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
