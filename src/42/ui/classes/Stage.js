/* eslint-disable complexity */

import Reactive from "./Reactive.js"
import resolveScope from "../utils/resolveScope.js"
import pendingDone from "../utils/pendingDone.js"
import findScope from "../utils/findScope.js"

import Locator from "../../fabric/classes/Locator.js"
import Canceller from "../../fabric/classes/Canceller.js"
import Waitlist from "../../fabric/classes/Waitlist.js"

export class Stage {
  constructor(stage) {
    Object.assign(this, stage)
    this.scope ??= "/"
    this.steps ??= "?"
    this.renderers ??= Object.create(null)
    this.plugins ??= Object.create(null)
    this.computeds ??= Object.create(null)
    this.refs ??= Object.create(null)
    this.tmp ??= new Map()
    this.detacheds ??= new Set()
    this.scopeChain ??= []
    this.pluginHandlers ??= []
    this.scopeResolvers ??= {}
    this.actions ??= new Locator(Object.create(null), { delimiter: "/" })

    this.waitlistPreload ??= new Waitlist()
    this.waitlistPending ??= new Waitlist()
    this.waitlistPostrender ??= new Waitlist()
    this.waitlistComponents ??= new Waitlist()
    this.waitlistTraits ??= new Waitlist()

    this.cancel ??= new Canceller()
    this.reactive ??= new Reactive(this)

    this.pendingDone ??= async () => pendingDone(this)
  }

  get signal() {
    return this.cancel.signal
  }
  set signal(_) {}

  resolve(loc) {
    return resolveScope(...findScope(this, loc), this)
  }

  get(loc) {
    loc = resolveScope(...findScope(this, loc), this)
    return this.reactive.get(loc)
  }
}

export default Stage
