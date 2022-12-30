import inIframe from "../../../core/env/realm/inIframe.js"

export async function makeHints(hints) {
  const out = Object.create(null)

  if (hints.items.name) {
    const moduleName = inIframe ? "ipc" : hints.items.name
    out.items = await import(`./${moduleName}ItemsHint.js`) //
      .then((m) => m.default(hints.items))
  }

  return out
}

export default makeHints
