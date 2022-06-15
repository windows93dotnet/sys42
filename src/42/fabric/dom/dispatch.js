export default function dispatch(el, name, detail) {
  el = el.isConnected ? el : globalThis
  el.dispatchEvent(
    name instanceof Error
      ? new ErrorEvent("error", {
          error: name,
          message: name.message,
          bubbles: true,
          ...detail,
        })
      : new CustomEvent(name, { bubbles: true, ...detail })
  )
}
