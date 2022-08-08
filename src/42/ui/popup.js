import xrealm from "../core/ipc/xrealm.js"
import { objectifyDef, forkDef } from "./normalize.js"
import uid from "../core/uid.js"

const popup = xrealm(
  async function popup(def, ctx) {
    console.log(888, def, ctx)
    return { opener: def.opener }
  },
  {
    input(def = {}, ctx) {
      if (!def.opener) {
        document.activeElement.id ||= uid()
        def.opener ??= document.activeElement.id
      }

      if (xrealm.inTop) return [objectifyDef(def), { ...ctx }]
      return [forkDef(def, ctx), {}]
    },

    output({ res, opener }) {
      document.querySelector(opener)?.focus()
      return res
    },
  }
)

export default popup
