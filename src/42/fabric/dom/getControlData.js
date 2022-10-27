export default function getControlData(el) {
  let val =
    "valueAsDate" in el && el.valueAsDate !== null //
      ? el.valueAsDate
      : el.value

  switch (el.type) {
    case "number":
    case "range":
      return val === "" ? undefined : Number(val)

    case "checkbox":
      // @read https://css-tricks.com/indeterminate-checkboxes/
      return el.indeterminate ? undefined : el.checked

    case "radio":
      if (el.checked) return el.value
      return (
        el.form?.elements[el.name] ||
        document.querySelector(`input[type="radio"][name="${el.name}"]:checked`)
      )?.value

    case "select-multiple":
      val = []
      for (const opt of el.options) if (opt.selected) val.push(opt.value)
      return val

    default:
  }

  return val === "" ? undefined : val
}
