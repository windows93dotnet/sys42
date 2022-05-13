/* eslint-disable arrow-body-style */
import registerRenderer from "../utils/registerRenderer.js"
import template from "../../system/formats/template.js"
import joinScope from "../utils/joinScope.js"
// import resolveScope from "../utils/resolveScope.js"

const { fromTemplate } = registerRenderer

function setVal(val, key, el) {
  el[key] = val
}

// function saveState(ctx, key, val) {
//   const scope = joinScope(ctx?.scope ?? "", key)
//   // console.log(scope, key)
//   if (!ctx.global.rack.has(scope)) ctx.global.rack.set(scope, val)
//   // ctx.global.state.set(scope, val)
//   return scope
// }

export default function renderKeyVal(options, renderer = setVal) {
  if (typeof options === "string") options = { val: options }

  let { ctx, key, val, el /* , dynamic */ } = options
  val ??= options.value
  const type = typeof val

  if (type === "string") {
    const parsed = template.parse(val)
    if (parsed.substitutions.length > 0) {
      return void fromTemplate(ctx, el, parsed, (val) => {
        // if (ctx && dynamic === true) saveState(ctx, key, val)
        return renderer(val, key, el)
      })
    }
  } else if (type === "object" && "watch" in val) {
    // const scope = resolveScope(ctx, val.watch)
    const scope = joinScope(ctx?.scope ?? "", val.watch)
    return void registerRenderer(ctx, scope, () => {
      // if (ctx && dynamic === true) saveState(ctx, key, val)
      return renderer(ctx.global.rack.get(scope), key, el)
    })
  }

  // if (ctx && dynamic === true) {
  //   const scope = saveState(ctx, key, val)
  //   return void registerRenderer(ctx, scope, () =>
  //     renderer(ctx.global.rack.get(scope), key, el)
  //   )
  // }

  renderer(val, key, el)
}
