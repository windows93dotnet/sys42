import create from "./create.js"
import register from "./register.js"
import normalize from "./normalize.js"

const SHORTCUTS = {
  "\n\n": () => document.createElement("br"),
  "---": () => document.createElement("hr"),
}

export default function render(...args) {
  const { type, def, ctx } = normalize(...args)

  if (type === "string") return SHORTCUTS[def]?.() ?? def

  if (type === "function") {
    const textNode = document.createTextNode("")
    register(def.keys, ctx, () => {
      textNode.textContent = def(ctx.state.proxy)
    })
    return textNode
  }

  if (type === "object" && Array.isArray(def)) {
    const fragment = document.createDocumentFragment()
    for (const content of def) fragment.append(render(content, ctx))
    return fragment
  }

  const el = create(def.tag)
  if (def.content) el.append(render(def.content, ctx))

  return el
}
