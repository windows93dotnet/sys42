export function dispatch(el, name, options) {
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
        ...options,
      }

      el.dispatchEvent(new ErrorEvent("error", eventInit))
    })

    return
  }

  const event = new CustomEvent(name, { bubbles: true, ...options })
  el.dispatchEvent(event)
  return event
}

export default dispatch
