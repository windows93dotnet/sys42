export function setCssVar(el, name, val) {
  if (val === undefined) {
    val = name
    name = el
    el = document.documentElement
  }

  if (!name.startsWith("--")) name = "--" + name

  el.style.setProperty(name, val)
}

export function getCssVar(el, name) {
  if (name === undefined) {
    name = el
    el = document.documentElement
  }

  if (!name.startsWith("--")) name = "--" + name

  return getComputedStyle(el).getPropertyValue(name)
}

export default {
  get: getCssVar,
  set: setCssVar,
}
