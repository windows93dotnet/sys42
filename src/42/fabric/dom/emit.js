export default function emit(el, name, detail) {
  el.dispatchEvent(
    name instanceof Error
      ? new ErrorEvent("error", { error: name, bubbles: true })
      : new CustomEvent(name, { detail, bubbles: true })
  )
}
