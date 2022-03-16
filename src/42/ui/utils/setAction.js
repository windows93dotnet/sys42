import arrify from "../../fabric/type/any/arrify.js"
import joinScope from "./joinScope.js"
import serializeArgs from "./serializeArgs.js"

export default function setAction(el, { run, args }, ctx) {
  const type = typeof run

  let action

  if (type === "string") {
    let fn

    if ("component" in ctx && run in ctx.component) {
      fn = (...args) => ctx.component[run](...args)
    }

    fn ??= ctx.global.actions.get(joinScope(ctx.scope, run))

    action = { type: "click", fn }
  } else if (type === "function") {
    action = {
      type: "click",
      fn: run,
    }
  }

  if (!action.fn) throw new Error(`action not found: "${run}"`)

  action.fn = action.fn.bind(ctx.global.state.locateProxy(ctx.scope))

  const { signal } = ctx.cancel

  args = arrify(args)

  el.addEventListener(
    action.type,
    (e) => {
      if (el.getAttribute("aria-disabled") === "true") return
      action.fn(...serializeArgs(e, el, args))
    },
    { signal }
  )
}
