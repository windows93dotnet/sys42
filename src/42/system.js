import Emitter from "./fabric/classes/Emitter.js"

export class System extends Emitter {}

let system
if (globalThis.sys42 && globalThis.sys42 instanceof System) {
  system = globalThis.sys42
} else {
  system = new System()

  system.polyfills = []
  system.HOME = "/users/anonymous"
  system.DEV = false

  if (globalThis.location) {
    const params = new URLSearchParams(location.search)
    if (
      (params.has("dev") && params.get("dev") !== "false") ||
      (params.has("test") && params.get("test") !== "false")
    ) {
      system.DEV = true
    }
  }

  if (globalThis.sys42) Object.assign(system, globalThis.sys42)
  globalThis.sys42 = system
}

export default system
