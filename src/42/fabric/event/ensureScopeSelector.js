import uid from "../../core/uid.js"

export function ensureScopeSelector(selector, parent) {
  if (selector?.includes(":scope")) {
    parent.id ||= uid()
    selector = selector.replaceAll(":scope", "#" + parent.id)
  }

  return selector
}

export default ensureScopeSelector
