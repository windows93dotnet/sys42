/* eslint-disable complexity */
import Locator from "../class/Locator.js"

const IGNORE = new Set([
  "button",
  "fieldset",
  "form",
  "iframe",
  "map",
  "meta",
  "object",
  "output",
  "param",
])

export function getControlData(el, locator, prefix, index) {
  const { name } = el
  if (!name || el.disabled || IGNORE.has(el.localName)) return

  const key = prefix ? name.replace(prefix, index) : name
  if (key.split("/").includes("-")) return

  let val =
    "valueAsDate" in el && el.valueAsDate !== null //
      ? el.valueAsDate
      : el.value

  switch (el.type) {
    case "number":
    case "range":
      val = val === "" ? undefined : Number(val)
      break

    case "checkbox":
      val = el.checked
      break

    case "radio":
      val = (
        el.form?.elements[name] ||
        document.querySelector(`input[type="radio"][${name}]:checked`)
      )?.value
      break

    case "select-multiple":
      val = []
      for (const opt of el.options) if (opt.selected) val.push(opt.value)
      break

    default:
      break
  }

  if (!val && el.dataset.default) {
    try {
      val = JSON.parse(el.dataset.default)
    } catch {}
  } else if (el.localName === "fieldset") return

  locator.set(key, val)
  return val
}

export default function getFormData(parent, data, prefix, index) {
  const locator = data instanceof Locator ? data : new Locator(data)
  const list =
    parent instanceof NodeList
      ? parent
      : parent.elements ?? parent.querySelectorAll(":scope [name]")
  for (const el of list) getControlData(el, locator, prefix, index)
  return locator.value
}
