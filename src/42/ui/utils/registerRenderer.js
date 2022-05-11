import template from "../../system/formats/template.js"
import getFilter from "../../fabric/getFilter.js"
import getInheritedMethod from "../../fabric/dom/getInheritedMethod.js"
import resolveScope from "./resolveScope.js"
import isLength from "../../fabric/type/any/is/isLength.js"

function register(ctx, scope, render) {
  ctx.global.renderers[scope] ??= new Set()

  if (!ctx.global.renderers[scope].has(render)) {
    ctx.global.renderers[scope].add(render)

    ctx.cancel.signal.addEventListener(
      "abort",
      () => {
        ctx.global.renderers[scope].delete(render)
        if (ctx.global.renderers[scope].size === 0) {
          delete ctx.global.renderers[scope]
        }
      },
      { once: true }
    )
  }
}

export default function registerRenderer(ctx, scope, render) {
  if (ctx.global.renderers && scope !== undefined) {
    if (typeof scope === "string") register(ctx, scope, render)
    else for (const s of scope) register(ctx, s, render)
  }

  const res = render()
  if (res !== undefined) ctx.undones.push(res)
}

const resolveScopes = (ctx, arr) => arr.map((loc) => resolveScope(ctx, loc))

registerRenderer.fromDots = (ctx, arr, render) => {
  const scopes = resolveScopes(ctx, arr)
  if (scopes.length > 0) registerRenderer(ctx, scopes, render)
}

registerRenderer.fromTemplate = (ctx, el, parsedTemplate, render) => {
  const filters = { ...ctx.global.filters.value }
  const locals = ctx.global.state.getProxy(ctx.scope)

  const vars = []
  for (const tokens of parsedTemplate.substitutions) {
    for (const token of tokens) {
      if (token.type === "key") vars.push(token.value)
      else if (token.type === "arg" && isLength(token.value)) {
        vars.push(token.value)
      } else if (token.type === "function") {
        const { value } = token
        let filter
        filters[value] ??= async (...args) => {
          filter ??= getInheritedMethod(el, value) ?? (await getFilter(value))
          try {
            return await filter(...args)
          } catch (err) {
            console.log(err)
          }
        }
      }
    }
  }

  const scopes = new Set(resolveScopes(ctx, vars))

  const renderTemplate = template.compile(parsedTemplate, {
    async: true,
    locals,
    filters,
    thisArg: { el, ctx },
  })

  const fn = render
  render = async () => {
    const locals = ctx.global.state.getProxy(ctx.scope)
    fn(await renderTemplate(locals))
    return "registerRenderer.fromTemplate"
  }

  registerRenderer(ctx, scopes, render)
}
