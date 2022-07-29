import realm from "../core/realm.js"
import { objectifyDef, forkDef } from "./normalize.js"

const popup = realm({
  name: "popup",

  args(def, ctx) {
    if (realm.inTop) return [objectifyDef(def), { ...ctx }]
    return [forkDef(def, ctx), {}]
  },

  async top(def, ctx) {
    console.log(888, def, ctx)
  },
})

export default popup
