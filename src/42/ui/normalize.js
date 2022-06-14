/* eslint-disable max-depth */
import State from "./class/State.js"
import resolve from "./resolve.js"
import register from "./register.js"
import Locator from "../fabric/class/Locator.js"
import template from "../system/formats/template.js"
import Canceller from "../fabric/class/Canceller.js"
import Undones from "../fabric/class/Undones.js"
import getFilter from "../fabric/getFilter.js"
import dirname from "../fabric/type/path/extract/dirname.js"
import emit from "../fabric/dom/emit.js"
import isEmptyObject from "../fabric/type/any/is/isEmptyObject.js"
import isLength from "../fabric/type/any/is/isLength.js"
import isArrayLike from "../fabric/type/any/is/isArrayLike.js"
import ATTRIBUTES_ALLOW_LIST from "../fabric/constants/ATTRIBUTES_ALLOW_LIST.js"

const DEF_KEYWORDS = new Set([
  "actions",
  "computed",
  "content",
  "data",
  "repeat",
  "schema",
  "scope",
  "tag",
  "when",
])

function normaliseString(def, ctx) {
  const parsed = template.parse(def)

  if (parsed.substitutions.length > 0) {
    const filters = { ...ctx.actions.value }
    const scopes = []
    for (const tokens of parsed.substitutions) {
      for (const token of tokens) {
        const loc = resolve(ctx.scope, token.value)

        if (token.type === "key") {
          token.value = loc
          scopes.push(token.value)
        } else if (token.type === "arg" && isLength(token.value)) {
          scopes.push(loc)
          if (isArrayLike(ctx.state.get(dirname(loc)))) {
            token.type = "key"
            token.value = loc
          } else {
            token.loc = loc
          }
        } else if (token.type === "function") {
          if (ctx.actions.has(loc) === false) {
            let filter
            filters[token.value] = async (...args) => {
              filter ??=
                ctx.el[token.value]?.bind(ctx.el) ??
                (await getFilter(token.value))

              try {
                return await filter(...args)
              } catch (err) {
                emit(ctx.el, err)
              }
            }
          } else token.value = loc
        }
      }
    }

    def = template.compile(parsed, {
      async: true,
      sep: "/",
      thisArg: ctx,
      filters,
    })

    def.scopes = scopes
    return def
  }

  return def
}

function normalizeObject(def, ctx) {
  const out = {}

  for (const [key, val] of Object.entries(def)) {
    out[key] = typeof val === "string" ? normaliseString(val, ctx) : val
  }

  return out
}

export function normalizeAttrs(def, ctx) {
  const attrs = {}

  for (const [key, val] of Object.entries(def)) {
    if (
      !DEF_KEYWORDS.has(key) &&
      (ctx?.trusted || ATTRIBUTES_ALLOW_LIST.includes(key))
    ) {
      const type = typeof val
      if (val && type === "object") {
        if (key === "class" && Array.isArray(val)) {
          attrs[key] = normaliseString(val.join(" "), ctx)
        } else {
          attrs[key] = normalizeObject(val, ctx)
        }
      } else {
        attrs[key] = type === "string" ? normaliseString(val, ctx) : val
      }
    }
  }

  return attrs
}

function normalizeComputed(computed, ctx) {
  for (const [key, val] of Object.entries(computed)) {
    const scope = resolve(ctx.scope, key)
    const fn = typeof val === "string" ? normaliseString(val, ctx) : val
    if (fn.scopes) {
      register(ctx, fn, (val, changed) => {
        ctx.computeds.set(scope, val)
        if (changed !== scope) ctx.state.updateNow(scope, val)
      })
    }
  }
}

export function normalizeCtx(ctx = {}) {
  ctx.scope ??= "/"
  ctx.renderers ??= {}
  ctx.transfers ??= {}
  ctx.componentsIndexes ??= {}
  ctx.components ??= new Undones()
  ctx.undones ??= new Undones()
  ctx.actions ??= new Locator({}, { sep: "/" })
  ctx.computeds ??= new Locator({}, { sep: "/" })
  ctx.cancel ??= new Canceller()
  ctx.state ??= new State(ctx)
  return ctx
}

export function normalizeDef(def = {}, ctx = normalizeCtx()) {
  ctx.type = typeof def

  if (ctx.type === "string") {
    const fn = normaliseString(def, ctx)
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

    if (def.computed) normalizeComputed(def.computed, ctx)

    if (def.scope) ctx.scope = resolve(ctx.scope, def.scope)

    const attrs = normalizeAttrs(def, ctx)
    if (!isEmptyObject(attrs)) def.attrs = attrs

    if (def.props) {
      for (const key of Object.keys(def.props)) {
        if (key in def && typeof def[key] === "string") {
          def[key] = normaliseString(def[key], ctx)
        }
      }
    }
  }

  return def
}

export default function normalize(def, ctx) {
  ctx = { ...normalizeCtx(ctx) }
  def = normalizeDef(def, ctx)
  return { def, ctx }
}
