// [1] SVG doesn't support `className` // TODO: check browser compatibility
export default function setClasses(el, val) {
  if (Array.isArray(val)) el.setAttribute("class", val.join(" ") /* [1] */)
  else {
    const type = typeof val
    if (type === "string") el.setAttribute("class", val /* [1] */)
    else if (val && type === "object") {
      for (const [keys, value] of Object.entries(val)) {
        const op = value ? "add" : "remove"
        for (const key of keys.split(" ")) el.classList[op](key)
      }
    }
  }

  return el
}
