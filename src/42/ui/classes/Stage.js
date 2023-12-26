/* eslint-disable complexity */
import Reactive from "./Reactive.js"
import resolveScope from "../utils/resolveScope.js"
import findScope from "../utils/findScope.js"
import Locator from "../../fabric/classes/Locator.js"
import Canceller from "../../fabric/classes/Canceller.js"
import Waitlist from "../../fabric/classes/Waitlist.js"
import untilNextTask from "../../fabric/type/promise/untilNextTask.js"

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
    this.sandboxes ??= new Map()
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
  }

  get state() {
    return this.reactive.state
  }

  get signal() {
    return this.cancel.signal
  }

  resolve(loc) {
    return resolveScope(...findScope(this, loc), this)
  }

  get(loc) {
    return this.reactive.get(resolveScope(...findScope(this, loc), this))
  }

  fork(params) {
    return new Stage(params ? { ...this, ...params } : this)
  }

  async pendingDone(n = 10) {
    await Promise.all([
      this.waitlistPending.done(),
      this.waitlistComponents.done(),
    ])

    await this.reactive.pendingUpdate

    if (this.waitlistPending.length > 0 || this.waitlistComponents.length > 0) {
      if (n < 0) throw new Error("Too much recursion")
      await untilNextTask()
      await this.pendingDone(--n)
    }
  }
}

export default Stage
