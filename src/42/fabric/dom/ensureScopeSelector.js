import uid from "../../core/uid.js"

export function ensureScopeSelector(selector, parent, options) {
  if (selector?.includes(":scope")) {
    parent.id ||= uid()
    selector = selector.replaceAll(":scope", `#${parent.id}`)
  } else if (
    options?.allowOutOfScope !== true &&
    selector.startsWith(`#${parent.id}`) === false
  ) {
    parent.id ||= uid()
    selector = `#${parent.id} ${selector}`
  }

  return selector
}

export default ensureScopeSelector
