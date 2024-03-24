/* eslint-disable complexity */
import Reactive from "./Reactive.js"
import resolveScope from "../utils/resolveScope.js"
import findScope from "../utils/findScope.js"
import Locator from "../../fabric/classes/Locator.js"
import Canceller from "../../fabric/classes/Canceller.js"
import Waitlist from "../../fabric/classes/Waitlist.js"
import untilNextTask from "../../fabric/type/promise/untilNextTask.js"

const _isStage = Symbol.for("Stage.isStage")

export class Stage {
  [_isStage] = true

  /** @param {object} [obj] */
  constructor(obj = {}) {
    this.id = obj.id
    this.type = obj.type
    this.el = obj.el
    this.parent = obj.parent
    this.component = obj.component

    this.trusted = obj.trusted
    this.initiator = obj.initiator
    this.firstUpdateMade = obj.firstUpdateMade

    this.scope = obj.scope ?? "/"
    this.steps = obj.steps ?? "?"
    this.index = obj.index ?? 0
    this.renderers = obj.renderers ?? Object.create(null)
    this.plugins = obj.plugins ?? Object.create(null)
    this.computeds = obj.computeds ?? Object.create(null)
    this.refs = obj.refs ?? Object.create(null)
    this.tmp = obj.tmp ?? new Map()
    this.sandboxes = obj.sandboxes ?? new Map()
    this.scopeChain = obj.scopeChain ?? []
    this.pluginHandlers = obj.pluginHandlers ?? []
    this.scopeResolvers = obj.scopeResolvers ?? {}
    this.actions = obj.actions ?? new Locator(Object.create(null), "/")

    this.waitlistPreload = obj.waitlistPreload ?? new Waitlist()
    this.waitlistPending = obj.waitlistPending ?? new Waitlist()
    this.waitlistPostrender = obj.waitlistPostrender ?? new Waitlist()
    this.waitlistComponents = obj.waitlistComponents ?? new Waitlist()
    this.waitlistTraits = obj.waitlistTraits ?? new Waitlist()

    /** @type {Canceller} */
    this.cancel = obj.cancel ?? new Canceller()

    /** @type {Reactive} */
    this.reactive = obj.reactive ?? new Reactive(this)
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

  /** @param {object} [obj] */
  fork(obj) {
    return new Stage(obj ? { ...this, ...obj } : this)
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
