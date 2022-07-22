export default function setFieldData(el, val) {
  switch (el.type) {
    case "checkbox":
      if (val == null) el.indeterminate = true
      else {
        el.indeterminate = false
        el.checked = val
      }

      break

    case "radio":
      el.checked = el.value === val
      break

    case "select-multiple":
      val ??= []
      for (const opt of el.options) opt.selected = val.includes(opt.value)
      break

    default:
      el.value = val ?? ""
  }
}
