export default function dispatch(el, name, detail) {
  el = el.isConnected ? el : globalThis

  if (name instanceof Error) {
    const error = name
    const dispatchErr = new Error()
    import("../type/error/stackTrace.js").then((module) => {
      const stack = module.default(dispatchErr).at(-1)
      const eventInit = {
        bubbles: true,
        cancelable: true,
        error,
        message: error.message,
        lineno: stack.line,
        colno: stack.column,
        filename: stack.filename,
        ...detail,
      }

      el.dispatchEvent(new ErrorEvent("error", eventInit))
    })
  }

  const event = new CustomEvent(name, { bubbles: true, ...detail })
  el.dispatchEvent(event)
  return event
}
