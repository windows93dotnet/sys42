/* eslint-disable max-depth */
import State from "./class/State.js"
import Locator from "../fabric/class/Locator.js"
import template from "../system/formats/template.js"
import Canceller from "../fabric/class/Canceller.js"
import Undones from "../fabric/class/Undones.js"
import getFilter from "../fabric/getFilter.js"
import resolvePath from "../fabric/type/path/core/resolvePath.js"
import dirname from "../fabric/type/path/extract/dirname.js"
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

function resolve(scope, path) {
  return resolvePath(scope, String(path)).replaceAll(".", "/")
}

function normaliseString(def, ctx) {
  const parsed = template.parse(def)

  const filters = { ...ctx.actions.value }

  if (parsed.substitutions.length > 0) {
    const keys = []
    for (const tokens of parsed.substitutions) {
      for (const token of tokens) {
        const loc = resolve(ctx.scope, token.value)
        if (token.type === "key") {
          token.value = loc
          keys.push(token.value)
        } else if (
          token.type === "arg" &&
          isLength(token.value) &&
          isArrayLike(ctx.state.get(dirname(loc)))
        ) {
          token.type = "key"
          token.value = loc
          keys.push(token.value)
        } else if (token.type === "function") {
          if (ctx.actions.has(loc) === false) {
            let filter
            filters[token.value] = async (...args) => {
              filter ??= await getFilter(token.value)
              try {
                return await filter(...args)
              } catch (err) {
                console.log(err)
              }
            }
          } else token.value = loc
        }
      }
    }

    def = template.compile(parsed, {
      async: true,
      sep: "/",
      filters,
      thisArg: ctx,
    })

    def.keys = keys
    return def
  }
}

function normalizeStyles(def, ctx) {
  const styles = []
  for (const [key, val] of Object.entries(def)) {
    styles.push([
      key,
      typeof val === "string" ? normaliseString(val, ctx) ?? val : val,
    ])
  }

  return styles
}

export function normalizeAttrs(def, ctx) {
  const attrs = []
  for (const [key, val] of Object.entries(def)) {
    if (
      !DEF_KEYWORDS.has(key) &&
      (ctx?.trusted || ATTRIBUTES_ALLOW_LIST.includes(key))
    ) {
      const type = typeof val
      if (key === "style" && val && type === "object") {
        attrs.push([key, normalizeStyles(val, ctx)])
      } else {
        attrs.push([
          key,
          type === "string" ? normaliseString(val, ctx) ?? val : val,
        ])
      }
    }
  }

  return attrs
}

export default function normalize(def = {}, ctx = {}) {
  ctx.scope ??= "/"
  ctx.renderers ??= {}
  ctx.undones ??= new Undones()
  ctx.actions ??= new Locator({}, { sep: "/" })
  ctx.cancel ??= new Canceller()
  ctx.state ??= new State(ctx)
  ctx = { ...ctx }

  let type = typeof def

  if (type === "string") {
    const fn = normaliseString(def, ctx)
    if (fn) {
      def = fn
      type = "function"
    }
  } else if (Array.isArray(def)) {
    type = "array"
  } else {
    if (def.actions) ctx.actions.assign(ctx.scope, def.actions)

    if (def.data) {
      if (typeof def.data === "function") {
        ctx.undones.push(
          (async () => {
            const res = await def.data()
            ctx.state.assign(ctx.scope, res)
          })()
        )
      } else ctx.state.assign(ctx.scope, def.data)
    }

    if (def.scope) ctx.scope = resolvePath(ctx.scope, def.scope)

    const attrs = normalizeAttrs(def, ctx)
    if (attrs.length > 0) def.attrs = attrs
  }

  return {
    type,
    def,
    ctx,
  }
}
