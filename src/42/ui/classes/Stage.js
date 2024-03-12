/* eslint-disable complexity */
import Reactive from "./Reactive.js"
import resolveScope from "../utils/resolveScope.js"
import findScope from "../utils/findScope.js"
import Locator from "../../fabric/classes/Locator.js"
import Canceller from "../../fabric/classes/Canceller.js"
import Waitlist from "../../fabric/classes/Waitlist.js"
import untilNextTask from "../../fabric/type/promise/untilNextTask.js"

export class Stage {
  /** @param {object} [params] */
  constructor(params = {}) {
    this.id = params.id
    this.type = params.type
    this.el = params.el
    this.parent = params.parent
    this.component = params.component

    this.trusted = params.trusted
    this.initiator = params.initiator
    this.firstUpdateMade = params.firstUpdateMade

    this.scope = params.scope ?? "/"
    this.steps = params.steps ?? "?"
    this.index = params.index ?? 0
    this.renderers = params.renderers ?? Object.create(null)
    this.plugins = params.plugins ?? Object.create(null)
    this.computeds = params.computeds ?? Object.create(null)
    this.refs = params.refs ?? Object.create(null)
    this.tmp = params.tmp ?? new Map()
    this.sandboxes = params.sandboxes ?? new Map()
    this.scopeChain = params.scopeChain ?? []
    this.pluginHandlers = params.pluginHandlers ?? []
    this.scopeResolvers = params.scopeResolvers ?? {}
    this.actions = params.actions ?? new Locator(Object.create(null), "/")

    this.waitlistPreload = params.waitlistPreload ?? new Waitlist()
    this.waitlistPending = params.waitlistPending ?? new Waitlist()
    this.waitlistPostrender = params.waitlistPostrender ?? new Waitlist()
    this.waitlistComponents = params.waitlistComponents ?? new Waitlist()
    this.waitlistTraits = params.waitlistTraits ?? new Waitlist()

    /** @type {Canceller} */
    this.cancel = params.cancel ?? new Canceller()

    /** @type {Reactive} */
    this.reactive = params.reactive ?? new Reactive(this)
  }

  get state() {
    return this.reactive.state
  }

  get signal() {
    return this.cancel.signal
  }

  /** @param {string} loc */
  resolve(loc) {
    return resolveScope(...findScope(this, loc), this)
  }

  /** @param {string} loc */
  get(loc) {
    return this.reactive.get(resolveScope(...findScope(this, loc), this))
  }

  /** @param {object} [params] */
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
