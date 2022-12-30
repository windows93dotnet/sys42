import inIframe from "../../../core/env/realm/inIframe.js"

export async function makeHints(hints, el) {
  if (typeof hints.items === "string") {
    hints.items = { name: hints.items }
  }

  if (typeof hints.dropzone === "string") {
    hints.dropzone = { name: hints.dropzone }
  }

  const undones = []

  if (hints.items) {
    const itemsModuleName = inIframe ? "ipc" : hints.items.name
    undones.push(
      import(`./${itemsModuleName}ItemsHint.js`) //
        .then((m) => m.default(hints.items))
    )
  }

  if (hints.dropzone) {
    const dropzoneModuleName = hints.dropzone.name
    undones.push(
      import(`./${dropzoneModuleName}DropzoneHint.js`) //
        .then((m) => m.default(el, hints.dropzone))
    )
  }

  const [items, dropzone] = await Promise.all(undones)

  return { items, dropzone }
}

export default makeHints
