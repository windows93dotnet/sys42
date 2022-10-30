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
import dispatch from "../fabric/event/dispatch.js"
import isEmptyObject from "../fabric/type/any/is/isEmptyObject.js"
import noop from "../fabric/type/function/noop.js"
import arrify from "../fabric/type/any/arrify.js"
import hash from "../fabric/type/any/hash.js"
import getType from "../fabric/type/any/getType.js"
import inTop from "../core/env/realm/inTop.js"
import merge from "../fabric/type/object/merge.js"
import ALLOWED_HTML_ATTRIBUTES from "../fabric/constants/ALLOWED_HTML_ATTRIBUTES.js"
import ALLOWED_SVG_ATTRIBUTES from "../fabric/constants/ALLOWED_SVG_ATTRIBUTES.js"

const ATTRIBUTES = new Set([
  ...ALLOWED_HTML_ATTRIBUTES,
  ...ALLOWED_SVG_ATTRIBUTES,
  "dataset",
  "aria",
])
const ATTRIBUTES_WITHDASH = new Set(["acceptCharset", "httpEquiv"])

const DEF_KEYWORDS = new Set([
  "actions",
  "animate",
  "bind",
  "click",
  "computed",
  "content",
  "contextmenu",
  "defaults",
  "dialog",
  "each",
  "else",
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
  // TODO: implement once https://vuejs.org/api/built-in-directives.html#v-once
  // TODO: implement memo https://vuejs.org/api/built-in-directives.html#v-memo
])

const TRAIT_KEYWORDS = new Set([
  "emittable",
  "movable",
  "positionable",
  "selectable",
])

const _INSTANCES = Symbol.for("Trait.INSTANCES")
const _isComponent = Symbol.for("Component.isComponent")
const _isTrait = Symbol.for("Trait.isTrait")

const sep = "/"

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

const findAction = (obj, tokens) => {
  let current = obj
  let thisArg = obj
  let lastObj

  for (const key of tokens) {
    if (typeof current !== "object" || key in current === false) return
    lastObj = current
    current = current[key]
  }

  if (lastObj[_isComponent] || lastObj[_isTrait]) thisArg = lastObj

  return [thisArg, current]
}

function findComponentAction(ctx, cpn, value) {
  let loc = value
  if (loc.startsWith("/")) return
  if (loc.startsWith("./")) loc = loc.slice(2)

  const levels = loc.split("../")
  const tokens = locate.parse(levels.pop())
  let i = levels.length
  let cpnCnt = 0

  while (cpn) {
    cpnCnt++
    if (i-- < 1) {
      const res = findAction(cpn, tokens)
      if (res) return res
      if (levels.length > 0) break
    }

    cpn = cpn.parent
  }

  if (levels.length > 0) {
    if (cpnCnt === levels.length) {
      const fn = locate.evaluate(ctx.actions.value, tokens)
      if (fn) return [ctx, fn]
    }

    dispatch(
      ctx.el,
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
    const tokens = allocate.parse(entry)
    if (exists.evaluate(obj, tokens) === false) {
      allocate.evaluate(obj, tokens, el)
    }
  }
}

export function normalizeTokens(tokens, ctx, options) {
  let hasFilter = false
  const scopes = []
  const actions = options?.actions ?? { ...ctx.actions.value }

  for (const token of tokens) {
    if (token.value === undefined) continue

    let loc = resolveScope(...findScope(ctx, token.value), ctx)

    if (options?.specials) {
      for (const special of options.specials) {
        if (special === loc.split("/")[1]) {
          loc = resolveScope(ctx.scope, token.value)
        }
      }
    }

    if (token.type === "key") {
      token.value = loc
      scopes.push(token.value)
    } else if (token.type === "function") {
      hasFilter = true

      let action
      let thisArg

      if (ctx.component) {
        const res = findComponentAction(ctx, ctx.component, token.value)
        if (res) {
          thisArg = res[0]
          action = res[1]
        }
      }

      const scope = ctx.scope === "/" ? "" : ctx.scope
      if (!action && ctx.actions.has(scope + loc)) {
        thisArg = ctx
        action = ctx.actions.get(scope + loc)
      }

      if (!action && ctx.actions.has(loc)) {
        thisArg = ctx
        action = ctx.actions.get(loc)
      }

      let fn

      if (action) {
        fn = makeActionFn(action, thisArg, ctx.el)
      } else {
        const thisArg = ctx
        const { value } = token
        const err = new TypeError(
          `Template filter is not a function: "${value}"`
        )
        fn = filters(value).then((filter) => {
          if (typeof filter !== "function") return void dispatch(ctx.el, err)
          return makeActionFn(filter, thisArg, ctx.el)
        })
      }

      allocate(actions, loc, fn, sep)

      token.value = loc
    }
  }

  const locals = options?.locals ?? {}

  queueMicrotask(() => {
    if (locals.this) return
    // TODO: check possible xss vector attack
    locals.this = ctx.el
  })

  // locals.this = {
  //   get value() {
  //     return ctx.el.value
  //   },
  //   get textContent() {
  //     return ctx.el.textContent
  //   },
  //   get rect() {
  //     return ctx.el.getBoundingCLientRect()
  //   },
  // }

  return { hasFilter, scopes, actions, locals }
}

export function normalizeString(item, ctx) {
  const parsed = template.parse(item)

  if (parsed.substitutions.length > 0) {
    const actions = { ...ctx.actions.value }
    const scopes = []
    let hasFilter = false
    const locals = {}
    for (const tokens of parsed.substitutions) {
      const res = normalizeTokens(tokens, ctx, { actions, locals })
      hasFilter ||= res.hasFilter
      scopes.push(...res.scopes)
    }

    item = template.compile(parsed, {
      async: true,
      sep: "/",
      actions,
      locals,
    })

    item.scopes = scopes

    const isRef = !hasFilter && parsed.strings.every((x) => x === "")
    if (isRef) item.ref = scopes[0]
    return item
  }

  return item
}

function normalizeObject(item, ctx) {
  const out = {}

  for (const [key, val] of Object.entries(item)) {
    out[key] = typeof val === "string" ? normalizeString(val, ctx) : val
  }

  return out
}

function supportsAttribute(item, attribute) {
  const tag = item.tag?.split(/[#.[]/)[0] || "div"
  return Boolean(attribute in document.createElement(tag))
}

export function normalizeAttrs(item, ctx, ignore) {
  const attrs = {}

  for (const [key, val] of Object.entries(item)) {
    if (
      !DEF_KEYWORDS.has(key) &&
      !TRAIT_KEYWORDS.has(key) &&
      !(ignore && key in ignore) &&
      (ATTRIBUTES.has(key.toLowerCase()) ||
        ATTRIBUTES_WITHDASH.has(key) ||
        (ctx?.trusted && supportsAttribute(item, key)))
    ) {
      const type = typeof val
      if (val && type === "object") {
        if (key === "class" && Array.isArray(val)) {
          attrs[key] = normalizeString(val.join(" "), ctx)
        } else {
          attrs[key] = normalizeObject(val, ctx)
        }
      } else {
        attrs[key] = type === "string" ? normalizeString(val, ctx) : val
      }
    }
  }

  return attrs
}

export function normalizeFromTo(obj) {
  return typeof obj === "string" || !("from" in obj || "to" in obj)
    ? { from: obj, to: obj }
    : obj
}

export function normalizeComputeds(computeds, ctx) {
  for (const [key, val] of Object.entries(computeds)) {
    normalizeComputed(resolveScope(...findScope(ctx, key), ctx), val, ctx)
  }
}

export function normalizeComputed(scope, val, ctx, cb = noop) {
  ctx.computeds[scope] = true
  const fn = typeof val === "string" ? normalizeString(val, ctx) : val
  if (fn.scopes) {
    ctx.reactive.set(`$computed${scope}`, undefined, { silent: true })
    register(ctx, fn, (val, changed) => {
      ctx.reactive.set(`$computed${scope}`, val, { silent: true })
      if (changed !== scope) ctx.reactive.updateNow(scope, val)
      cb(val)
    })
  }
}

const SPLIT_REGEX = /\s*\|\|\s*/
export function normalizeWatchs(watch, ctx) {
  for (const [key, val] of Object.entries(watch)) {
    for (const item of key.split(SPLIT_REGEX)) {
      normalizeWatch(resolveScope(...findScope(ctx, item), ctx), val, ctx)
    }
  }
}

export function normalizeWatch(scope, fn, ctx) {
  const locals = {}
  if (typeof fn === "string") {
    const tokens = expr.parse(fn)
    const { actions } = normalizeTokens(tokens, ctx, { locals })
    fn = expr.compile(tokens, {
      assignment: true,
      async: true,
      sep: "/",
      actions,
    })
  }

  register(ctx, scope, async () => {
    await 0
    await fn(ctx.reactive.state, locals)
  })
}

export function normalizeScope(def, ctx) {
  if (def?.scope) {
    ctx.scope = resolveScope(ctx.scope, def.scope, ctx)
  }
}

export function normalizeData(def, ctx, cb) {
  if (typeof def === "function") {
    const { scope } = ctx
    ctx.undones.push(
      (async () => {
        const res = await def()
        cb(res, scope)
      })()
    )
  } else {
    cb(def, ctx.scope)
  }
}

export function normalizePlugins(ctx, plugins) {
  for (const plugin of plugins) {
    let promise
    if (typeof plugin === "string") {
      promise = import(`./plugins/${plugin}.plugin.js`) //
        .then((m) => m.default(ctx))
    } else if (Array.isArray(plugin)) {
      if (typeof plugin[0] === "string") {
        promise = import(`./plugins/${plugin[0]}.plugin.js`) //
          .then((m) => m.default(ctx, plugin[1]))
      } else {
        promise = plugin[0](ctx, plugin[1])
      }
    } else {
      promise = plugin(ctx)
    }

    ctx.preload.push(
      promise.then((res) => {
        if (typeof res === "function") ctx.pluginHandlers.push(res)
      })
    )
  }
}

export function normalizeTraits(def, ctx) {
  const list = []
  const traits = def.traits ?? {}

  for (const key of TRAIT_KEYWORDS) if (key in def) traits[key] = def[key]

  for (const [name, raw] of Object.entries(traits)) {
    const val = typeof raw === "string" ? normalizeString(raw, ctx) : raw
    const trait = { name, val }
    list.push(trait)
    ctx.preload.push(
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
    await ctx.preload
    for (const { module, name, val } of list) {
      const fn = (val) => {
        if (val === false) el[_INSTANCES]?.[name]?.destroy()
        else module(el, { signal: ctx.signal, ...val })
      }

      if (val.scopes) register(ctx, val, fn)
      else fn(val)
    }
  }
}

function extractWatchFromOn(def) {
  for (const item of def.on) {
    for (const key in item) {
      if (Object.hasOwn(item, key) && key.includes(":")) {
        const val = item[key]
        const events = []
        for (const event of key.split(SPLIT_REGEX)) {
          if (event.startsWith(":")) {
            def.watch ??= {}
            def.watch[event.slice(1)] = val
          } else events.push(event)
        }

        delete item[key]
        item[events.join("||")] = val
      }
    }
  }
}

function normalizeOn(def) {
  if (def.on) def.on = arrify(def.on)

  if (def.click) {
    def.on ??= []
    def.on.push({ click: def.click })
  }

  if (def.toggle) {
    def.aria ??= {}
    def.aria.pressed ??= false
    def.aria.controls ??= def.toggle
    def.on ??= []
    def.on.push({
      click(e, target) {
        const el = document.querySelector("#" + def.toggle)
        if (el) {
          el.classList.toggle("hide")
          target.setAttribute("aria-pressed", !el.classList.contains("hide"))
        }
      },
    })
  }

  if (def.dialog) {
    def.on ??= []
    def.on.push({ click: { dialog: def.dialog } })
  }

  if (def.popup) {
    def.on ??= []
    def.on.push({ "pointerdown || Enter || ArrowRight": { popup: def.popup } })
  }

  if (def.menu) {
    def.on ??= []
    def.on.push({
      "pointerdown || Enter || ArrowRight": {
        popup: {
          tag: "ui-menu",
          closeEvents: "pointerdown || ArrowLeft",
          ...objectifyDef(def.menu),
        },
      },
    })
  }

  if (def.contextmenu) {
    def.on ??= []
    def.on.push({
      disrupt: true,
      contextmenu: {
        popup: {
          tag: "ui-menu",
          closeEvents: "pointerdown",
          ...objectifyDef(def.contextmenu),
        },
      },
    })
  }

  if (def.on) extractWatchFromOn(def)
}

/* def
====== */

export function objectifyDef(def) {
  if (def != null) {
    if (typeof def === "object" && !Array.isArray(def)) return def
    return { content: def }
  }

  return {}
}

export function forkDef(def, ctx) {
  if (def?.content === undefined || def?.scope) def = { content: def }

  def = { ...def }

  if (ctx) {
    if (ctx.plugins) def.plugins = Object.keys(ctx.plugins)
    if (ctx.scope) def.scope = ctx.scope
    if (ctx.scopeChain) def.scopeChain = structuredClone(ctx.scopeChain)
    if (ctx.reactive) def.state = structuredClone(ctx.reactive.data)
    if (ctx.id) def.initiator = ctx.id
    if (ctx.actions) def.actions = merge({}, ctx.actions.value)
  }

  return def
}

export function ensureDef(def = {}, ctx) {
  def = { ...def }

  if (def.initiator) {
    ctx.initiator = def.initiator
    delete def.initiator
  }

  if (def.scopeChain) {
    ctx.scopeChain = def.scopeChain
    delete def.scopeChain
  }

  return def
}

export function normalizeDefNoCtx(def = {}) {
  if (def.animate) def.animate = normalizeFromTo(def.animate)
  if (def.bind) def.bind = normalizeFromTo(def.bind)
  normalizeOn(def)
  return def
}

export function normalizeDef(def = {}, ctx, options) {
  ctx.id ??= def.id ?? hash(def)
  ctx.type = getType(def)

  if (ctx.type === "string") {
    const fn = normalizeString(def, ctx)
    ctx.type = typeof fn
    if (ctx.type === "function") def = fn
  } else if (ctx.type === "object") {
    def = ensureDef(def, ctx)

    if (def.state) {
      normalizeData(def.state, ctx, (res, scope) => {
        ctx.reactive.merge(scope, res)
      })
    }

    normalizeScope(def, ctx)

    const traits = normalizeTraits(def, ctx)
    if (traits) def.traits = traits

    if (options?.skipNoCtx !== true) normalizeDefNoCtx(def)

    if (def.computed) normalizeComputeds(def.computed, ctx)
    if (def.watch) normalizeWatchs(def.watch, ctx)

    if (options?.skipAttrs !== true) {
      const attrs = normalizeAttrs(def, ctx)
      if (!isEmptyObject(attrs)) def.attrs = attrs
    }

    if (def.actions) {
      normalizeData(def.actions, ctx, (res) => {
        ctx.actions.merge("/", res)
      })
    }

    if (!inTop && ctx.initiator) {
      def.plugins ??= []
      if (!def.plugins.includes("ipc")) def.plugins.push("ipc")
    }

    if (def.plugins) {
      normalizeData(def.plugins, ctx, (res) => {
        normalizePlugins(ctx, res)
      })
    }
  }

  return def
}

/* ctx
====== */

export function normalizeCtx(ctx = {}) {
  // TODO: write protect ctx.trusted
  ctx = { ...ctx }
  ctx.scope ??= "/"
  ctx.steps ??= "?"
  ctx.renderers ??= Object.create(null)
  ctx.plugins ??= Object.create(null)
  ctx.computeds ??= Object.create(null)
  ctx.scopeChain ??= []
  ctx.pluginHandlers ??= []
  ctx.actions ??= new Locator(Object.create(null), { sep: "/" })

  ctx.preload ??= new Undones()
  ctx.components ??= new Undones()
  ctx.undones ??= new Undones()
  ctx.postrender ??= new Undones()

  ctx.cancel ??= new Canceller()
  ctx.signal = ctx.cancel.signal
  ctx.reactive ??= new Reactive(ctx)

  return ctx
}

export default function normalize(def, ctx = {}) {
  ctx = normalizeCtx(ctx)
  def = normalizeDef(def, ctx)
  return [def, ctx]
}
