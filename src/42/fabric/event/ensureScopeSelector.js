import uid from "../../core/uid.js"

export function ensureScopeSelector(selector, parent, options) {
  parent.id ||= uid()

  if (selector?.includes(":scope")) {
    selector = selector.replaceAll(":scope", `#${parent.id}`)
  } else if (options?.allowOutOfScope !== true) {
    selector = `#${parent.id} ${selector}`
  }

  return selector
}

export default ensureScopeSelector
