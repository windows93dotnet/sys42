export function dispatch(el, name, options) {
  el = el?.isConnected ? el : globalThis

  if (name instanceof Error) {
    const error = name

    el.dispatchEvent(
      new ErrorEvent("error", {
        bubbles: true,
        cancelable: true,
        message: error.message,
        error,
        ...options,
      }),
    )

    return
  }

  const event = new CustomEvent(name, { bubbles: true, ...options })
  el.dispatchEvent(event)
  return event
}

export default dispatch
