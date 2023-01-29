/* eslint-disable max-depth */
import Reactive from "./classes/Reactive.js"
import resolveScope from "./resolveScope.js"
import findScope from "./findScope.js"
import register from "./register.js"
import Locator from "../fabric/classes/Locator.js"
import exists from "../fabric/locator/exists.js"
import locate from "../fabric/locator/locate.js"
import allocate from "../fabric/locator/allocate.js"
import template from "../core/formats/template.js"
import expr from "../core/expr.js"
import Canceller from "../fabric/classes/Canceller.js"
import Undones from "../fabric/classes/Undones.js"
import filters from "../core/filters.js"
import traverse from "../fabric/type/object/traverse.js"
import dispatch from "../fabric/event/dispatch.js"
import isEmptyObject from "../fabric/type/any/is/isEmptyObject.js"
import noop from "../fabric/type/function/noop.js"
import arrify from "../fabric/type/any/arrify.js"
import merge from "../fabric/type/object/merge.js"
import hash from "../fabric/type/any/hash.js"
import getType from "../fabric/type/any/getType.js"
import inTop from "../core/env/realm/inTop.js"
import segmentize from "../fabric/type/string/segmentize.js"
import { handleEffect } from "../core/dt/dataTransferEffects.js"
import ALLOWED_HTML_ATTRIBUTES from "../fabric/constants/ALLOWED_HTML_ATTRIBUTES.js"
import ALLOWED_SVG_ATTRIBUTES from "../fabric/constants/ALLOWED_SVG_ATTRIBUTES.js"

const ATTRIBUTES = new Set([
  ...ALLOWED_HTML_ATTRIBUTES,
  ...ALLOWED_SVG_ATTRIBUTES,
  "dataset",
  "aria",
])
const ATTRIBUTES_WITHDASH = new Set(["acceptCharset", "httpEquiv"])

const PLAN_KEYWORDS = new Set([
  "actions",
  "animate",
  "bind",
  "click",
  "computed",
  "content",
  "contextmenu",
  "defaults",
  "dialog",
  "dropzone",
  "each",
  "else",
  "height",
  "if",
  "initiator",
  "menu",
  "on",
  "picto",
  "plugins",
  "popup",
  "schema",
  "scope",
  "scopeChain",
  "state",
  "tag",
  "traits",
  "width",
  // TODO: implement once https://vuejs.org/api/built-in-directives.html#v-once
  // TODO: implement memo https://vuejs.org/api/built-in-directives.html#v-memo
])

const TRAIT_KEYWORDS = new Set([
  "emittable",
  "movable",
  "positionable",
  "selectable",
  "transferable",
])

const _INSTANCES = Symbol.for("Trait.INSTANCES")
const _isComponent = Symbol.for("Component.isComponent")
const _isTrait = Symbol.for("Trait.isTrait")

const delimiter = "/"
const UNALLOWED_COMPONENT_ACTIONS = new Set(["render"])

const makeActionFn =
  (fn, thisArg, el) =>
  async (...args) => {
    try {
      if (thisArg === undefined) return await fn(...args)
      return await fn.call(thisArg, ...args)
    } catch (err) {
      dispatch(el, err)
    }
  }

const findAction = (obj, segments) => {
  let current = obj
  let thisArg = obj
  let lastObj

  for (const key of segments) {
    if (
      typeof current !== "object" ||
      key in current === false ||
      UNALLOWED_COMPONENT_ACTIONS.has(key)
    ) {
      return
    }

    // ensure component action is not from base constructors
    let hasAction
    let proto = current
    do {
      hasAction = Object.hasOwn(proto, key)
      proto = Object.getPrototypeOf(proto)
      const name = proto?.constructor?.name
      if (name === "Component" || name === "HTMLElement") break
    } while (!hasAction && proto)

    if (!hasAction) return

    lastObj = current
    current = current[key]
  }

  if (lastObj[_isComponent] || lastObj[_isTrait]) thisArg = lastObj

  return [thisArg, current]
}

function findComponentAction(stage, cpn, value) {
  let loc = value
  if (loc.startsWith("/")) return
  if (loc.startsWith("./")) loc = loc.slice(2)

  const levels = loc.split("../")
  const segments = locate.segmentize(levels.pop())
  let i = levels.length
  let cpnCnt = 0

  while (cpn) {
    cpnCnt++
    if (i-- < 1) {
      const res = findAction(cpn, segments)
      if (res) return res
      if (levels.length > 0) break
    }

    cpn = cpn.parent
  }

  if (levels.length > 0) {
    if (cpnCnt === levels.length) {
      const fn = locate.run(stage.actions.value, segments)
      if (fn) return [stage, fn]
    }

    dispatch(
      stage.el,
      new Error(
        `Action path is going above root by ${
          levels.length - cpnCnt
        } level(s): ${value}`
      )
    )
  }
}

export function addEntry(obj, entry, el) {
  if (obj) {
    const segments = allocate.segmentize(entry)
    if (exists.run(obj, segments) === false) {
      allocate.run(obj, segments, el)
    }
  }
}

export function normalizeTokens(tokens, stage, options) {
  let hasFilter = false
  const scopes = []
  const actions = options?.actions ?? { ...stage.actions.value }

  for (const token of tokens) {
    if (token.value === undefined) continue

    let loc

    if (options?.specials) {
      const segment = segmentize(token.value, [".", "/"])[0]
      loc = options.specials.includes(segment)
        ? resolveScope(stage.scope, token.value)
        : resolveScope(...findScope(stage, token.value), stage)
    } else {
      loc = resolveScope(...findScope(stage, token.value), stage)
    }

    if (token.type === "key") {
      token.value = loc
      scopes.push(token.value)
    } else if (token.type === "function") {
      hasFilter = true

      let action
      let thisArg

      if (stage.component) {
        const res = findComponentAction(stage, stage.component, token.value)
        if (res) {
          thisArg = res[0]
          action = res[1]
        }
      }

      const scope = stage.scope === "/" ? "" : stage.scope
      if (!action && stage.actions.has(scope + loc)) {
        thisArg = stage
        action = stage.actions.get(scope + loc)
      }

      if (!action && stage.actions.has(loc)) {
        thisArg = stage
        action = stage.actions.get(loc)
      }

      let fn

      if (typeof action === "function") {
        fn = makeActionFn(action, thisArg, stage.el)
      } else {
        const thisArg = stage
        const { value } = token
        const err = new TypeError(
          `Template filter is not a function: "${value}"`
        )
        fn = filters(value).then((filter) => {
          if (typeof filter !== "function") return void dispatch(stage.el, err)
          return makeActionFn(filter, thisArg, stage.el)
        })
      }

      allocate(actions, loc, fn, delimiter)

      token.value = loc
    }
  }

  const locals = options?.locals ?? {}

  // queueMicrotask(() => {
  //   if (locals.this) return
  //   // TODO: check possible xss vector attack
  //   locals.this = stage.el
  // })

  // locals.this = {
  //   get value() {
  //     return stage.el.value
  //   },
  //   get textContent() {
  //     return stage.el.textContent
  //   },
  //   get rect() {
  //     return stage.el.getBoundingCLientRect()
  //   },
  // }

  return { hasFilter, scopes, actions, locals }
}

export function normalizeString(item, stage) {
  const parsed = template.parse(item)

  if (parsed.substitutions.length > 0) {
    const actions = { ...stage.actions.value }
    const scopes = []
    let hasFilter = false
    const locals = {}
    for (const tokens of parsed.substitutions) {
      const res = normalizeTokens(tokens, stage, { actions, locals })
      hasFilter ||= res.hasFilter
      scopes.push(...res.scopes)
    }

    item = template.compile(parsed, {
      async: true,
      delimiter: "/",
      actions,
      locals,
    })

    item.scopes = scopes

    const isRef = !hasFilter && parsed.strings.every((x) => x === "")
    if (isRef) item.ref = scopes[0]
    return item
  }

  return parsed.strings.join()
}

function normalizeObject(item, stage) {
  const out = {}

  for (const [key, val] of Object.entries(item)) {
    out[key] = typeof val === "string" ? normalizeString(val, stage) : val
  }

  return out
}

function supportsAttribute(item, attribute) {
  const tag = item.tag?.split(/[#.[]/)[0] || "div"
  return Boolean(attribute in document.createElement(tag))
}

const OBJECT_ATTRIBUTES = new Set(["dataset", "aria", "style"])

export function normalizeAttrs(item, stage, ignore) {
  const attrs = {}

  for (const [key, val] of Object.entries(item)) {
    // TODO: use extractAttrs
    if (
      !PLAN_KEYWORDS.has(key) &&
      !TRAIT_KEYWORDS.has(key) &&
      !(ignore && key in ignore) &&
      (ATTRIBUTES.has(key.toLowerCase()) ||
        ATTRIBUTES_WITHDASH.has(key) ||
        (stage?.trusted && supportsAttribute(item, key)))
    ) {
      const type = typeof val

      if (val && type === "object") {
        if (key === "class") {
          attrs[key] = Array.isArray(val)
            ? normalizeString(val.join(" "), stage)
            : normalizeObject(val, stage)
        } else if (
          !OBJECT_ATTRIBUTES.has(key) &&
          Object.getPrototypeOf(val).toString !== Object.prototype.toString
        ) {
          attrs[key] = val.toString()
        } else {
          attrs[key] = normalizeObject(val, stage)
        }
      } else {
        attrs[key] = type === "string" ? normalizeString(val, stage) : val
      }
    }
  }

  return attrs
}

export function extractAttrs(item, stage, ignore) {
  const attrs = Object.create(null)

  for (const [key, val] of Object.entries(item)) {
    if (
      !PLAN_KEYWORDS.has(key) &&
      !TRAIT_KEYWORDS.has(key) &&
      !(ignore && key in ignore) &&
      (ATTRIBUTES.has(key.toLowerCase()) ||
        ATTRIBUTES_WITHDASH.has(key) ||
        (stage?.trusted && supportsAttribute(item, key)))
    ) {
      attrs[key] = val
    }
  }

  return attrs
}

export function normalizeFromTo(obj) {
  return typeof obj === "string" || !("from" in obj || "to" in obj)
    ? { from: obj, to: obj }
    : obj
}

export function normalizeStartEnd(obj) {
  return typeof obj === "string" || !("start" in obj || "end" in obj)
    ? { start: obj }
    : obj
}

export function normalizeComputeds(computeds, stage) {
  for (const [key, val] of Object.entries(computeds)) {
    normalizeComputed(resolveScope(...findScope(stage, key), stage), val, stage)
  }
}

export function normalizeComputed(scope, val, stage, cb = noop) {
  stage.computeds[scope] = true
  const fn = typeof val === "string" ? normalizeString(val, stage) : val
  if (fn.scopes) {
    stage.reactive.set(`$computed${scope}`, undefined, { silent: true })
    register(stage, fn, (val, changed) => {
      stage.reactive.set(`$computed${scope}`, val, { silent: true })
      if (changed !== scope) stage.reactive.updateNow(scope, val)
      cb(val)
    })
  }
}

const SPLIT_REGEX = /\s*\|\|\s*/
export function normalizeWatchs(watch, stage) {
  for (const [key, val] of Object.entries(watch)) {
    for (const item of key.split(SPLIT_REGEX)) {
      normalizeWatch(resolveScope(...findScope(stage, item), stage), val, stage)
    }
  }
}

export function normalizeWatch(scope, fn, stage) {
  if (typeof fn === "string") {
    const locals = {}
    const tokens = expr.parse(fn)
    const { actions } = normalizeTokens(tokens, stage, { locals })
    fn = expr.compile(tokens, {
      assignment: true,
      async: true,
      delimiter: "/",
      actions,
    })
    register(stage, scope, async (changed) => {
      if (!changed) return
      await 0
      await fn(stage.reactive.state, locals)
    })
  } else {
    // If the value is a function
    // The first argument should be the scopped state
    // to mimic template get/set
    // e.g.
    // ":foo": "{{foo + 1}}"
    // ":foo": ({foo}) => foo + 1
    // e.g.
    // ":foo": "{{bar = foo + 1}}"
    // ":foo": (state) => { state.bar = state.foo + 1 }
    register(stage, scope, async (changed) => {
      if (!changed) return
      await 0
      await fn(stage.reactive.get(stage.scope), stage)
    })
  }
}

export function normalizePlugins(stage, plugins, options) {
  const undones = []

  for (const plugin of plugins) {
    let key
    let config
    let fn

    if (Array.isArray(plugin)) {
      key = plugin[0]
      config = plugin[1]
    } else {
      const type = typeof plugin
      if (type === "string") key = plugin
      else if (type === "function") {
        fn = plugin
        key = plugin.name
      } else {
        throw new Error(
          `Plugin definition must be a string, a function or an array: ${type}`
        )
      }
    }

    if (key) {
      if (stage.plugins[key]) continue
      stage.plugins[key] = true
    }

    const promise = fn
      ? fn(stage, config)
      : import(`./plugins/${plugin}.plugin.js`) //
          .then((m) => m.default(stage, config))

    if (options?.now) undones.push(promise)
    else {
      stage.preload.push(
        (async () => {
          const res = await promise
          if (typeof res === "function") stage.pluginHandlers.push(res)
        })()
      )
    }
  }

  if (options?.now) return Promise.all(undones)
}

export function normalizeTraits(plan, stage) {
  const list = []
  const traits = plan.traits ?? {}

  for (const key of TRAIT_KEYWORDS) if (key in plan) traits[key] = plan[key]

  for (const [name, raw] of Object.entries(traits)) {
    const val = typeof raw === "string" ? normalizeString(raw, stage) : raw
    const trait = { name, val }
    list.push(trait)
    stage.preload.push(
      import(
        name === "emittable"
          ? "../fabric/traits/emittable.js"
          : `./traits/${name}.js`
      ).then((m) => {
        trait.module = m.default
      })
    )
  }

  if (list.length === 0) return

  return async (el) => {
    await stage.preload
    await el.ready

    const undones = []

    for (const { module, name, val } of list) {
      const traitReady = []
      traverse(val, (key, val, obj) => {
        if (typeof val === "string") {
          const fn = normalizeString(val, stage)
          if (typeof fn === "function") {
            traitReady.push(
              fn(stage.reactive.state).then((res) => {
                obj[key] = res
              })
            )
          }
        }
      })

      undones.push(
        Promise.all(traitReady).then(() => {
          const fn = (val) => {
            if (val === false) el[_INSTANCES]?.[name]?.destroy()
            else module(el, { signal: stage.signal, ...val })
          }

          if (val.scopes) register(stage, val, fn)
          else fn(val)
        })
      )
    }

    await Promise.all(undones)
  }
}

function extractWatchFromOn(plan) {
  for (const item of plan.on) {
    for (const key in item) {
      if (Object.hasOwn(item, key) && key.includes(":")) {
        const val = item[key]
        const events = []
        for (const event of key.split(SPLIT_REGEX)) {
          if (event.startsWith(":")) {
            plan.watch ??= {}
            plan.watch[event.slice(1)] = val
          } else events.push(event)
        }

        delete item[key]
        item[events.join("||")] = val
      }
    }
  }
}

function normalizeOn(plan) {
  if (plan.on) plan.on = arrify(plan.on)

  if (plan.click) {
    plan.on ??= []
    plan.on.push({ click: plan.click })
    delete plan.click
  }

  if (plan.toggle) {
    plan.aria ??= {}
    plan.aria.pressed ??= false
    plan.aria.controls ??= plan.toggle
    plan.on ??= []
    plan.on.push({
      click(e, target) {
        const el = document.querySelector("#" + plan.toggle)
        if (el) {
          el.classList.toggle("hide")
          target.setAttribute("aria-pressed", !el.classList.contains("hide"))
        }
      },
    })
    delete plan.toggle
  }

  if (plan.dialog) {
    plan.on ??= []
    plan.on.push({ click: { dialog: plan.dialog } })
    delete plan.dialog
  }

  if (plan.popup) {
    plan.on ??= []
    plan.on.push({
      "pointerdown || Enter || ArrowRight": { popup: plan.popup },
    })
    delete plan.popup
  }

  if (plan.menu) {
    plan.on ??= []
    plan.on.push({
      "pointerdown || Enter || ArrowRight": {
        popup: {
          tag: "ui-menu",
          closeEvents: "pointerdown || ArrowLeft",
          ...objectifyPlan(plan.menu),
        },
      },
    })
    delete plan.menu
  }

  if (plan.contextmenu) {
    plan.on ??= []
    plan.on.push({
      disrupt: true,
      contextmenu: {
        popup: {
          tag: "ui-menu",
          closeEvents: "pointerdown",
          ...objectifyPlan(plan.contextmenu),
        },
      },
    })
    delete plan.contextmenu
  }

  if (plan.dropzone) {
    plan.on ??= []
    plan.on.push({
      "prevent": true,
      "dragover || dragenter"(e) {
        handleEffect(e)
      },
    })
    delete plan.dropzone
  }

  if (plan.on) extractWatchFromOn(plan)
}

/* plan
====== */

export function objectifyPlan(plan) {
  if (plan != null) {
    if (typeof plan === "object" && !Array.isArray(plan)) return plan
    return { content: plan }
  }

  return {}
}

export function forkPlan(plan, stage) {
  if (plan?.content === undefined || plan?.scope) plan = { content: plan }

  plan = { ...plan }

  if (stage) {
    const data = stage.reactive?.data
    if (!isEmptyObject(data)) plan.state = merge({}, data)
    if (stage.id) plan.initiator = stage.id
    if (stage.scope) plan.scope = stage.scope
    if (stage.scopeChain) plan.scopeChain = merge([], stage.scopeChain)
    if (stage.plugins) plan.plugins = Object.keys(stage.plugins)
    const actions = stage.actions.value
    if (!isEmptyObject(actions)) {
      plan.actions = merge({}, actions)
      plan.actionsScope = "/"
    }
  }

  return plan
}

export function ensurePlan(plan = {}, stage) {
  plan = { ...plan }

  if (plan.initiator) {
    stage.initiator = plan.initiator
    delete plan.initiator
  }

  if (plan.scopeChain) {
    stage.scopeChain = plan.scopeChain
    delete plan.scopeChain
  }

  return plan
}

export function normalizePlanWithoutStage(plan = {}) {
  if (plan.animate) plan.animate = normalizeFromTo(plan.animate)
  if (plan.bind) plan.bind = normalizeFromTo(plan.bind)
  normalizeOn(plan)
  return plan
}

export function normalizeData(plan, stage, cb) {
  if (typeof plan === "function") {
    const { scope } = stage
    stage.undones.push(
      (async () => {
        const res = await plan()
        cb(res, scope)
      })()
    )
  } else {
    cb(plan, stage.scope, { silent: true })
  }
}

export function normalizeState(plan, stage, initiator) {
  if (plan.state) {
    normalizeData(plan.state, stage, (res, scope, options) => {
      if (stage.scopeChain.length > 0 && !initiator) {
        stage.scopeChain.push({ scope, props: Object.keys(plan.state) })
      }

      stage.reactive.merge(scope, res, options)
    })
  }
}

export function normalizeScope(plan, stage) {
  if (plan?.scope) {
    if (stage.scopeChain.length > 0) {
      stage.scopeChain.push({
        scope: stage.scope,
        props: stage.scopeChain.at(-1).props,
      })
    }

    stage.scope = resolveScope(stage.scope, plan.scope, stage)
    delete plan.scope
  }
}

export function normalizePlan(plan = {}, stage, options) {
  stage.id ??= plan.id ?? hash(plan)
  stage.type = getType(plan)
  if (stage.type === "number") {
    plan = String(plan)
    stage.type = "string"
  } else if (stage.type === "string") {
    plan = normalizeString(plan, stage)
    stage.type = typeof plan
  } else if (stage.type === "object") {
    const { initiator } = plan
    plan = ensurePlan(plan, stage)

    const keyOrder = Object.keys(plan)

    if (keyOrder.indexOf("scope") < keyOrder.indexOf("state")) {
      normalizeScope(plan, stage)
      normalizeState(plan, stage, initiator)
    } else {
      normalizeState(plan, stage, initiator)
      normalizeScope(plan, stage)
    }

    const traits = normalizeTraits(plan, stage)
    if (traits) plan.setTraits = traits

    if (options?.skipNoStage !== true) normalizePlanWithoutStage(plan)

    if (plan.computed) normalizeComputeds(plan.computed, stage)
    if (plan.watch) normalizeWatchs(plan.watch, stage)

    if (options?.skipAttrs !== true) {
      const attrs = extractAttrs(plan, stage)
      if (!isEmptyObject(attrs)) plan.attrs = attrs
    }

    if (plan.actions) {
      normalizeData(plan.actions, stage, (res, scope) => {
        stage.actions.merge(plan.actionsScope ?? scope, res)
      })
    }

    if (!inTop && stage.initiator) {
      plan.plugins ??= []
      if (!plan.plugins.includes("ipc")) plan.plugins.push("ipc")
    }

    if (plan.picto) plan.picto = normalizeStartEnd(plan.picto)

    if (plan.plugins) {
      normalizeData(plan.plugins, stage, (res) => {
        normalizePlugins(stage, res)
      })
    }
  }

  return plan
}

/* stage
====== */

export function normalizeStage(stage = {}) {
  // TODO: write protect stage.trusted
  stage = { ...stage }
  stage.scope ??= "/"
  stage.steps ??= "?"
  stage.renderers ??= Object.create(null)
  stage.plugins ??= Object.create(null)
  stage.computeds ??= Object.create(null)
  stage.refs ??= Object.create(null)
  stage.scopeChain ??= []
  stage.pluginHandlers ??= []
  stage.scopeResolvers ??= {}
  stage.actions ??= new Locator(Object.create(null), { delimiter: "/" })

  stage.preload ??= new Undones()
  stage.components ??= new Undones()
  stage.undones ??= new Undones()
  stage.postrender ??= new Undones()
  stage.traitsReady ??= new Undones()

  stage.cancel ??= new Canceller()
  stage.signal = stage.cancel.signal
  stage.reactive ??= new Reactive(stage)

  return stage
}

export default function normalize(plan, stage = {}) {
  stage = normalizeStage(stage)
  plan = normalizePlan(plan, stage)
  return [plan, stage]
}
