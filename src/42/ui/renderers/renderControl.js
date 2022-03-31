import { setControlData } from "../../fabric/dom/setFormData.js"
import { getControlData } from "../../fabric/dom/getFormData.js"
import registerRenderer from "../utils/registerRenderer.js"
import renderAttributes from "./renderAttributes.js"
import arrify from "../../fabric/type/any/arrify.js"

export default function renderControl(el, def, ctx) {
  if (!el.name) return

  if (def.bind !== false) {
    const { signal } = ctx.cancel
    const handler = () => {
      getControlData(el, ctx.global.rack)
      ctx.global.state.update(el.name)
    }

    for (const event of arrify(def.bind ?? "input")) {
      el.addEventListener(event, handler, { signal })
    }
  }

  if (def.registerControl === undefined) {
    registerRenderer(ctx, el.name, () => setControlData(el, ctx.global.rack))
  } else {
    const l = ctx.undones.length
    renderAttributes(el, ctx, { value: def.registerControl })

    const registerValue = () => {
      ctx.global.rack.set(el.name, el.value)
      registerRenderer(ctx, el.name, () => setControlData(el, ctx.global.rack))
    }

    // wait for last undone if renderAttributes use an async function
    if (ctx.undones.length > l) ctx.undones.at(-1).then(registerValue)
    else registerValue()
  }
}
