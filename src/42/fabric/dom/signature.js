import configure from "../../core/configure.js"

export default function signature(target, args, DEFAULTS, normalize) {
  const definitions = []
  const options = []
  const selectors = []
  const elements = []
  const listeners = []
  let el

  const defaultsIsObject = DEFAULTS && typeof DEFAULTS === "object"

  for (const arg of args) {
    const type = typeof arg
    if (type === "string") selectors.push(arg)
    else if (type === "function") listeners.push(arg)
    else if (Array.isArray(arg)) definitions.push(arg)
    else if (type === "object") {
      if ("addEventListener" in arg) {
        elements.push(arg)
      } else if (
        defaultsIsObject &&
        Object.keys(arg).every((key) => key in DEFAULTS)
      ) {
        options.push(arg)
      } else definitions.push(arg)
    }
  }

  if (elements.length === 0) {
    if (selectors.length > 0) {
      const selector = selectors.shift()
      el = document.querySelector(selector)
      if (!el) throw new Error(`element not found: ${selector}`)
    } else el = window
  } else el = elements.pop()

  if (el) target.el = el
  if (listeners.length > 0) target.listener = listeners.pop()
  if (selectors.length > 0) target.selector = selectors.pop()
  if (options.length > 0) target.options = configure(...options)
  if (definitions.length > 0) {
    target.definitions = normalize
      ? configure(...definitions.map(normalize))
      : configure(...definitions)
  }

  return target
}
