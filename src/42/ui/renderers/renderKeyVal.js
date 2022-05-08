/* eslint-disable max-params */
import registerRenderer from "../utils/registerRenderer.js"
import template from "../../system/formats/template.js"
import joinScope from "../utils/joinScope.js"
// import resolveScope from "../utils/resolveScope.js"

const { fromTemplate } = registerRenderer

function setVal(el, key, val) {
  el[key] = val
}

// TODO: refactor "dynamic" boolean trap
export default function renderKeyVal(el, ctx, key, val, dynamic, renderer) {
  const type = typeof val

  renderer ??= typeof dynamic === "function" ? dynamic : setVal

  if (type === "string") {
    const parsed = template.parse(val)
    if (parsed.substitutions.length > 0) {
      return void fromTemplate(ctx, el, parsed, async (value) => {
        renderer(el, key, value)
      })
    }
  } else if (type === "object" && "watch" in val) {
    // const scope = resolveScope(ctx, val.watch)
    const scope = joinScope(ctx?.scope ?? "", val.watch)
    return void registerRenderer(ctx, scope, () => {
      renderer(el, key, ctx.global.rack.get(scope))
    })
  }

  if (ctx && dynamic === true) {
    const scope = joinScope(ctx?.scope ?? "", key)
    if (!ctx.global.state.has(scope)) ctx.global.state.set(scope, val)
    return void registerRenderer(ctx, scope, () => {
      renderer(el, key, ctx.global.rack.get(scope))
    })
  }

  renderer(el, key, val)
}
