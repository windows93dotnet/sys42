import State from "./class/State.js"
import resolveScope from "./resolveScope.js"
import register from "./register.js"
import Locator from "../fabric/class/Locator.js"
import template from "../system/formats/template.js"
import Canceller from "../fabric/class/Canceller.js"
import Undones from "../fabric/class/Undones.js"
import getFilter from "../fabric/getFilter.js"
import dirname from "../fabric/type/path/extract/dirname.js"
import dispatch from "../fabric/dom/dispatch.js"
import allocate from "../fabric/locator/allocate.js"
import isEmptyObject from "../fabric/type/any/is/isEmptyObject.js"
import isArrayLike from "../fabric/type/any/is/isArrayLike.js"
import noop from "../fabric/type/function/noop.js"
import ATTRIBUTES_ALLOW_LIST from "../fabric/constants/ATTRIBUTES_ALLOW_LIST.js"

const ATTRIBUTES = new Set(
  ATTRIBUTES_ALLOW_LIST.concat([
    "dataset",
    "aria",
    // TODO: add SVG_ATTRIBUTES_ALLOW_LIST
    "viewbox",
  ])
)
const ATTRIBUTES_WITHDASH = new Set(["acceptCharset", "httpEquiv"])

const DEF_KEYWORDS = new Set([
  "actions",
  "computed",
  "content",
  "data",
  "each",
  "else",
  "if",
  "schema",
  "scope",
  "tag",
])

const sep = "/"

const makeFilterFn =
  (filter, thisArg, el) =>
  async (...args) => {
    try {
      return await filter.call(thisArg, ...args)
    } catch (err) {
      dispatch(el, err)
    }
  }

export function normalizeTokens(tokens, ctx, filters) {
  let hasFilter = false
  const scopes = []
  filters ??= { ...ctx.actions.value }

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
      if (isArrayLike(ctx.state.get(dirname(loc)))) {
        token.type = "key"
        token.value = loc
      } else {
        token.loc = loc
      }
    } else if (token.type === "function") {
      hasFilter = true

      let filter
      let thisArg

      if (ctx.actions.has(loc)) {
        thisArg = ctx
        filter = ctx.actions.get(loc)
      } else if (token.value in ctx.el) {
        thisArg = ctx.el
        filter = ctx.el[token.value]
      }

      if (filter) {
        const fn = makeFilterFn(filter, thisArg, ctx.el)
        allocate(filters, loc, fn, sep)
      } else {
        const thisArg = ctx
        const fn = getFilter(token.value).then((filter) =>
          makeFilterFn(filter, thisArg, ctx.el)
        )
        allocate(filters, loc, fn, sep)
      }

      token.value = loc
    }
  }

  return { hasFilter, scopes, filters }
}

export function normalizeString(def, ctx) {
  const parsed = template.parse(def)

  if (parsed.substitutions.length > 0) {
    const filters = { ...ctx.actions.value }
    const scopes = []
    let hasFilter = false
    for (const tokens of parsed.substitutions) {
      const res = normalizeTokens(tokens, ctx, filters)
      hasFilter ||= res.hasFilter
      scopes.push(...res.scopes)
    }

    def = template.compile(parsed, {
      async: true,
      sep: "/",
      filters,
    })

    def.scopes = scopes
    def.hasFilter = hasFilter
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

export function normalizeAttrs(def, ctx) {
  const attrs = {}

  for (const [key, val] of Object.entries(def)) {
    if (
      !DEF_KEYWORDS.has(key) &&
      (ctx?.trusted ||
        ATTRIBUTES.has(key.toLowerCase()) ||
        ATTRIBUTES_WITHDASH.has(key))
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
      if (changed !== scope) ctx.state.updateNow(scope, val)
      cb(val)
    })
  }
}

export function normalizeCtx(ctx = {}) {
  ctx.scope ??= "/"
  ctx.renderers ??= {}
  ctx.componentsIndexes ??= {}
  ctx.components ??= new Undones()
  ctx.undones ??= new Undones()
  ctx.actions ??= new Locator({}, { sep: "/" })
  ctx.computeds ??= new Locator({}, { sep: "/" })
  ctx.cancel ??= new Canceller()
  ctx.state ??= new State(ctx)
  ctx.data ??= ctx.state.proxy
  return ctx
}

export function normalizeDef(def = {}, ctx = normalizeCtx(), options) {
  ctx.type = typeof def

  if (ctx.type === "string") {
    const fn = normalizeString(def, ctx)
    ctx.type = typeof fn
    if (ctx.type === "function") def = fn
  } else if (Array.isArray(def)) {
    ctx.type = "array"
  } else {
    if (def.actions) ctx.actions.assign(ctx.scope, def.actions)

    if (def.data) {
      if (typeof def.data === "function") {
        const { scope } = ctx
        ctx.undones.push(
          (async () => {
            const res = await def.data()
            ctx.state.assign(scope, res)
          })()
        )
      } else ctx.state.assign(ctx.scope, def.data)
    }

    if (def.computed) normalizeComputeds(def.computed, ctx)

    if (options?.attrs !== false) {
      const attrs = normalizeAttrs(def, ctx)
      if (!isEmptyObject(attrs)) def.attrs = attrs
    }

    if (def.scope) {
      if (ctx.stateScope) {
        ctx.stateScope = resolveScope(ctx.stateScope, def.scope, ctx)
      }

      ctx.scope = resolveScope(ctx.scope, def.scope, ctx)
    }
  }

  return def
}

export default function normalize(def, ctx) {
  ctx = { ...normalizeCtx(ctx) }
  def = normalizeDef(def, ctx)
  return { def, ctx }
}
