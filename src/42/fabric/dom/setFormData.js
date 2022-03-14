import Locator from "../class/Locator.js"

export function setControlData(el, rack, prefix, index) {
  const { name } = el

  if (!name) return

  const val = rack.get(prefix ? name.replace(prefix, index) : name)

  if (el.localName === "fieldset") return

  switch (el.type) {
    case "checkbox":
      el.checked = val
      break

    case "radio":
      el.checked = val
      break

    case "select-multiple":
      for (const opt of el.options) opt.selected = val.includes(opt.value)
      break

    default:
      el.value = val ?? ""
      break
  }
}

export default function setFormData(parent, data, prefix, index) {
  const rack = data instanceof Locator ? data : new Locator(data)
  const list =
    parent instanceof NodeList
      ? parent
      : parent.elements ?? parent.querySelectorAll("[name]")
  for (const el of list) setControlData(el, rack, prefix, index)
}
