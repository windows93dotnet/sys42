export function getPercent(target) {
  if (target.hasAttribute("max") === false) return target.value
  const max = target.getAttribute("max")
  return (target.value / max) * 100
}

export function addPercentProp(target) {
  target.style.setProperty("--percent", getPercent(target))
}

// @src https://stackoverflow.com/a/55111246
function setSelectionRange(el, selectionStart, selectionEnd) {
  const { value, clientHeight } = el
  el.value = value.slice(0, Math.max(0, selectionEnd))
  const { scrollHeight } = el
  el.value = value
  el.scrollTop =
    scrollHeight > clientHeight ? scrollHeight - clientHeight / 2 : 0
  el.setSelectionRange(selectionStart, selectionEnd)
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
      const { selectionStart, selectionEnd } = el
      el.value = val ?? ""
      if (document.activeElement === el) {
        setSelectionRange(el, selectionStart, selectionEnd)
      }

      break
    }

    default:
      el.value = val ?? ""
  }
}
