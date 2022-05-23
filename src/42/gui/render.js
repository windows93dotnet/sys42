import create from "./create.js"
import register from "./register.js"

export default function render(def, ctx) {
  const type = typeof def

  if (type === "string") {
    return def
  }

  if (type === "function") {
    const textNode = document.createTextNode("")
    register(def, ctx, () => {
      textNode.textContent = def(ctx.state)
    })
    return textNode
  }

  const el = create(def.tag)

  if (def.content) el.append(render(def.content, ctx))

  return el
}
