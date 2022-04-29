import arrify from "../../fabric/type/any/arrify.js"
import joinScope from "./joinScope.js"
import cancelEvent from "../../fabric/dom/cancelEvent.js"
import serializeArgs from "./serializeArgs.js"
import getParentMethod from "../../fabric/dom/getParentMethod.js"

export default function setAction(el, { run, args }, ctx) {
  ctx.undones.push(
    Promise.resolve().then(() => {
      const type = typeof run

      let action

      if (type === "string") {
        let fn = getParentMethod(el, run)

        fn ??= ctx.global.actions.get(joinScope(ctx.scope, run))

        action = { type: "click", fn }
      } else if (type === "function") {
        action = {
          type: "click",
          fn: run,
        }
      }

      if (!action.fn) throw new Error(`action not found: "${run}"`)

      const locals = ctx.global.state.getProxy(ctx.scope)
      action.fn = action.fn.bind(locals)

      const { signal } = ctx.cancel

      args = arrify(args)

      el.addEventListener(
        action.type,
        (e) => {
          if (el.getAttribute("aria-disabled") === "true") return
          const res = action.fn(...serializeArgs(e, el, args, locals))
          if (res === false) cancelEvent(e)
        },
        { signal }
      )

      return "setAction"
    })
  )
}
