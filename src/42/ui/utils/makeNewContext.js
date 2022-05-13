import Locator from "../../fabric/class/Locator.js"
import State from "../class/State.js"
import Undones from "../../fabric/class/Undones.js"
import Canceller from "../../fabric/class/Canceller.js"

export default function makeNewContext(ctx = {}) {
  ctx.scope ??= ""
  ctx.cancel ??= new Canceller()
  ctx.undones ??= new Undones()

  ctx.global ??= {}
  ctx.global.renderers ??= {}
  ctx.global.rack ??= new Locator()
  ctx.global.actions ??= new Locator()
  ctx.global.filters ??= new Locator()
  ctx.global.scopes ??= new Map()
  ctx.global.state ??= new State(ctx)

  return { ...ctx }
}
