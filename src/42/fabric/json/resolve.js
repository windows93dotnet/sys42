import { isArray, isObject } from "../type/any/is.js"
import walker from "./walker.js"
import JSONLocator from "./JSONLocator.js"

const isResolvable = (x) => isObject(x) || isArray(x)

function unref(location) {
  return location.replaceAll(`/$ref`, "")
}

function makeWalkerCallback(out) {
  return (ctx) => {
    if (!ctx.childs) {
      if (ctx.keyword === "$ref") {
        if (ctx.link) {
          const linkedValue = out.get(unref(ctx.link.location))
          if (linkedValue) out.set(unref(ctx.parent.location), linkedValue)
        } else {
          out.set(unref(ctx.parent.location), ctx.value)
        }
      } else if (
        !(ctx.parent.childs.size > 1 && ctx.parent.childs.has("$ref"))
      ) {
        out.set(unref(ctx.location), ctx.value)
      }
    } else if (ctx.keyword === "$ref" && ctx.link) {
      const linkedValue = out.get(unref(ctx.link.location))
      if (linkedValue) out.set(unref(ctx.location), linkedValue)
    } else if (ctx.childs.size === 0) {
      out.set(unref(ctx.location), ctx.value)
    }
  }
}

export function resolveSync(source, options) {
  if (isResolvable(source)) {
    const out = new JSONLocator(Array.isArray(source) ? [] : {})
    walker.sync(source, options, makeWalkerCallback(out))
    return out.value
  }

  return source
}

export async function resolve(source, options) {
  if (isResolvable(source)) {
    const out = new JSONLocator(Array.isArray(source) ? [] : {})
    await walker(source, options, makeWalkerCallback(out))
    return out.value
  }

  return source
}

export default resolve

resolve.sync = resolveSync
