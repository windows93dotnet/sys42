/* eslint-disable max-params */
import registerRenderer from "../utils/registerRenderer.js"
import template from "../../system/formats/template.js"
import joinScope from "../utils/joinScope.js"

const { fromTemplate } = registerRenderer

function setVal(el, key, val) {
  el[key] = val
}

export default function renderKeyVal(el, ctx, key, val, renderer = setVal) {
  const type = typeof val

  if (type === "string") {
    const parsed = template.parse(val)
    if (parsed.substitutions.length > 0) {
      return void fromTemplate(ctx, parsed, async (value) => {
        renderer(el, key, value)
      })
    }
  } else if (type === "object" && "watch" in val) {
    const scope = joinScope(ctx.scope, val.watch)
    return void registerRenderer(ctx, scope, () => {
      renderer(el, key, ctx.global.rack.get(scope))
    })
  }

  renderer(el, key, val)
}
