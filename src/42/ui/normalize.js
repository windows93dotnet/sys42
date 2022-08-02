import Reactive from "./class/Reactive.js"
import resolveScope from "./resolveScope.js"
import register from "./register.js"
import Locator from "../fabric/class/Locator.js"
import template from "../core/formats/template.js"
import Canceller from "../fabric/class/Canceller.js"
import Undones from "../fabric/class/Undones.js"
import filters from "../core/filters.js"
import dirname from "../fabric/type/path/extract/dirname.js"
import dispatch from "../fabric/dom/dispatch.js"
import allocate from "../fabric/locator/allocate.js"
import isEmptyObject from "../fabric/type/any/is/isEmptyObject.js"
import isArrayLike from "../fabric/type/any/is/isArrayLike.js"
import noop from "../fabric/type/function/noop.js"
import omit from "../fabric/type/object/omit.js"
import arrify from "../fabric/type/any/arrify.js"
import hash from "../fabric/type/any/hash.js"
import getType from "../fabric/getType.js"
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
  "click",
  "computed",
  "content",
  "dialog",
  "each",
  "else",
  "if",
  "on",
  "parentId",
  "plugins",
  "schema",
  "scope",
  "state",
  "tag",
])

const TRAIT_KEYWORDS = new Set([
  "movable", //
  "emittable",
  "selectable",
])

const _INSTANCES = Symbol.for("Trait.INSTANCES")

const sep = "/"

const makeActionFn =
  (filter, thisArg, el) =>
  async (...args) => {
    try {
      return await filter.call(thisArg, ...args)
    } catch (err) {
      dispatch(el, err)
    }
  }

export function normalizeTokens(tokens, ctx, actions) {
  let hasFilter = false
  const scopes = []
  actions ??= { ...ctx.actions.value }

  for (const token of tokens) {
    if (token.value === undefined) continue

    const loc = resolveScope(ctx, token.value)

    if (token.type === "key") {
      token.value = loc
      scopes.push(token.value)
    } else if (
      token.type === "arg" &&
      !token.negated &&
      Number.isInteger(token.value)
    ) {
      scopes.push(loc)
      if (isArrayLike(ctx.reactive.get(dirname(loc)))) {
        token.type = "key"
        token.value = loc
      } else {
        token.loc = loc
      }
    } else if (token.type === "function") {
      hasFilter = true

      let action
      let thisArg

      if (ctx.actions.has(loc)) {
        thisArg = ctx
        action = ctx.actions.get(loc)
      } else if (ctx.component && token.value in ctx.component) {
        thisArg = ctx.component
        action = ctx.component[token.value]
      }

      if (action) {
        const fn = makeActionFn(action, thisArg, ctx.el)
        allocate(actions, loc, fn, sep)
      } else {
        const thisArg = ctx
        const { value } = token
        const err = new TypeError(
          `Template filter is not a function: "${value}"`
        )
        const fn = filters(value).then((filter) => {
          if (typeof filter !== "function") return void dispatch(ctx.el, err)
          return makeActionFn(filter, thisArg, ctx.el)
        })
        allocate(actions, loc, fn, sep)
      }

      token.value = loc
    }
  }

  return { hasFilter, scopes, actions }
}

export function normalizeString(def, ctx) {
  const parsed = template.parse(def)

  if (parsed.substitutions.length > 0) {
    const actions = { ...ctx.actions.value }
    const scopes = []
    let hasFilter = false
    for (const tokens of parsed.substitutions) {
      const res = normalizeTokens(tokens, ctx, actions)
      hasFilter ||= res.hasFilter
      scopes.push(...res.scopes)
    }

    def = template.compile(parsed, {
      async: true,
      sep: "/",
      actions,
    })

    def.scopes = scopes

    const isRef = !hasFilter && parsed.strings.every((x) => x === "")
    if (isRef) def.ref = scopes[0]
    return def
  }

  return def
}

function normalizeObject(def, ctx) {
  const out = {}

  for (const [key, val] of Object.entries(def)) {
    out[key] = typeof val === "string" ? normalizeString(val, ctx) : val
  }

  return out
}

export function normalizeAttrs(def, ctx, ignore) {
  const attrs = {}

  for (const [key, val] of Object.entries(def)) {
    if (
      !DEF_KEYWORDS.has(key) &&
      (ctx?.trusted ||
        ATTRIBUTES.has(key.toLowerCase()) ||
        ATTRIBUTES_WITHDASH.has(key)) &&
      !(ignore && key in ignore)
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

export function normalizeAnimate(animate) {
  if (!("from" in animate || "to" in animate)) {
    return {
      from: animate,
      to: animate,
    }
  }

  return animate
}

export function normalizeComputeds(computeds, ctx) {
  for (const [key, val] of Object.entries(computeds)) {
    normalizeComputed(resolveScope(ctx.scope, key, ctx), val, ctx)
  }
}

export function normalizeComputed(scope, val, ctx, cb = noop) {
  const fn = typeof val === "string" ? normalizeString(val, ctx) : val
  if (fn.scopes) {
    register(ctx, fn, (val, changed) => {
      ctx.computeds.set(scope, val)
      if (changed !== scope) ctx.reactive.updateNow(scope, val)
      cb(val)
    })
  }
}

export function normalizeScope(def, ctx) {
  if (def?.scope) {
    if (ctx.globalScope) {
      ctx.globalScope = resolveScope(ctx.globalScope, def.scope, ctx)
    }

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
    if (typeof plugin === "string") {
      ctx.preload.push(
        import(`./plugins/${plugin}.plugin.js`) //
          .then((m) => m.default(ctx))
      )
    } else if (Array.isArray(plugin)) {
      ctx.preload.push(plugin[0](ctx, plugin[1]))
    } else {
      ctx.preload.push(plugin(ctx))
    }
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

function normalizeListen(def) {
  if (def.on) def.on = arrify(def.on)

  if (def.click) {
    def.on ??= []
    def.on.push({ click: def.click })
  }

  if (def.dialog) {
    def.on ??= []
    def.on.push({ click: { dialog: def.dialog } })
  }

  if (def.popup) {
    def.on ??= []
    def.on.push({ click: { popup: def.popup } })
  }
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
  def = objectifyDef(def)
  if (ctx) {
    def.scope = ctx.globalScope ?? ctx.scope
    def.state = omit(ctx.reactive.data, ["ui"])
    def.parentId = ctx.id
  }

  return def
}

export function normalizeDef(def = {}, ctx, options) {
  ctx.id ??= hash(def)
  ctx.type = getType(def)

  if (ctx.type === "string") {
    const fn = normalizeString(def, ctx)
    ctx.type = typeof fn
    if (ctx.type === "function") def = fn
  } else if (ctx.type === "object") {
    def = { ...def }
    if (def.parentId) ctx.parentId = def.parentId

    if (def.state) {
      normalizeData(def.state, ctx, (res, scope) => {
        ctx.reactive.merge(scope, res)
      })
    }

    if (def.actions) {
      normalizeData(def.actions, ctx, (res, scope) => {
        ctx.actions.merge(scope, res)
      })
    }

    if (def.animate) def.animate = normalizeAnimate(def.animate)

    if (def.computed) normalizeComputeds(def.computed, ctx)

    const traits = normalizeTraits(def, ctx)
    if (traits) def.traits = traits

    normalizeListen(def)

    if (options?.skipAttrs !== true) {
      const attrs = normalizeAttrs(def, ctx)
      if (!isEmptyObject(attrs)) def.attrs = attrs
    }

    normalizeScope(def, ctx)

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
  ctx = { ...ctx }
  ctx.scope ??= "/"
  ctx.renderers ??= {}
  ctx.plugins ??= {}
  ctx.steps ??= "?"

  ctx.components ??= new Undones()
  ctx.preload ??= new Undones()
  ctx.undones ??= new Undones()
  ctx.postrender ??= new Undones()
  ctx.actions ??= new Locator({}, { sep: "/" })
  ctx.computeds ??= new Locator({}, { sep: "/" })

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
