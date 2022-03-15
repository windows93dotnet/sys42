import { setControlData } from "../../fabric/dom/setFormData.js"
import { getControlData } from "../../fabric/dom/getFormData.js"
import registerRenderer from "../utils/registerRenderer.js"
import arrify from "../../fabric/type/any/arrify.js"

export default function renderControl(el, def, ctx) {
  if (!el.name) return

  if (def.bind !== false) {
    const { signal } = ctx.cancel
    const handler = () => {
      console.log(888, ctx.global.rack)
      getControlData(el, ctx.global.rack)
      ctx.global.state.update(el.name)
    }

    for (const event of arrify(def.bind ?? "input")) {
      el.addEventListener(event, handler, { signal })
    }
  }

  if (def.registerControl !== undefined) {
    ctx.global.rack.set(el.name, def.registerControl)
  }

  registerRenderer(ctx, el.name, () => {
    setControlData(el, ctx.global.rack)
  })
}
