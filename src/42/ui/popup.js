import xrealm from "../core/xrealm.js"
import { objectifyDef, forkDef } from "./normalize.js"

const popup = xrealm({
  name: "popup",

  args(def, ctx) {
    if (xrealm.inTop) return [objectifyDef(def), { ...ctx }]
    return [forkDef(def, ctx), {}]
  },

  async main(def, ctx) {
    console.log(888, def, ctx)
  },
})

export default popup
