export function getPercent(target) {
  if (target.hasAttribute("max") === false) return target.value
  const max = target.getAttribute("max")
  return (target.value / max) * 100
}

export function addPercentProp(target) {
  target.style.setProperty("--percent", getPercent(target))
}

export default function setControlData(el, val) {
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

    case "range":
    case "number":
      el.value = val ?? ""
      addPercentProp(el)
      break

    case "textarea": {
      // const top = el.scrollTop
      // const left = el.scrollLeft
      el.value = val ?? ""
      // el.setSelectionRange?.(0, 0)
      // requestAnimationFrame(() => el.scrollTo(top, left))
      break
    }

    default:
      el.value = val ?? ""
  }
}
