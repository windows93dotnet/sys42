import create from "./create.js"
import register from "./register.js"
import resolvePath from "../fabric/type/path/core/resolvePath.js"

function forkContext(ctx) {
  return { ...ctx }
}

export default function render(def, ctx) {
  const type = typeof def

  if (type === "string") return def

  ctx = forkContext(ctx)
  if (def.scope) ctx.scope = resolvePath(ctx.scope, def.scope)

  if (type === "function") {
    const textNode = document.createTextNode("")
    register(def, ctx, () => {
      textNode.textContent = def(ctx.state.get(ctx.scope))
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
