import render from "./render.js"
// import listen from "../fabric/dom/listen.js"

import xrealm from "../core/ipc/xrealm.js"
import { objectifyDef, forkDef } from "./normalize.js"
import uid from "../core/uid.js"

const popup = xrealm(
  async function popup(def, ctx) {
    const el = render(def, ctx)
    document.body.append(el)

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
