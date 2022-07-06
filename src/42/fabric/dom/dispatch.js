export default function dispatch(el, name, detail) {
  el = el.isConnected ? el : globalThis

  if (name instanceof Error) {
    const error = name
    const dispatchErr = new Error()
    import("../type/error/stackTrace.js").then((module) => {
      const stack = module.default(dispatchErr).at(-1)
      const eventInit = {
        error,
        message: error.message,
        bubbles: true,
        lineno: stack.line,
        colno: stack.column,
        filename: stack.filename,
        ...detail,
      }
      el.dispatchEvent(new ErrorEvent("error", eventInit))
    })
  } else {
    el.dispatchEvent(new CustomEvent(name, { bubbles: true, ...detail }))
  }
}
