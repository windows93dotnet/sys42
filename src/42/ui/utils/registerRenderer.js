import template from "../../system/formats/template.js"
import getFilter from "../../fabric/getFilter.js"
import getParentMethod from "../../fabric/dom/getParentMethod.js"
import joinScope from "./joinScope.js"
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

  ctx.undones.push(render())
}

const resolveScope = (ctx, arr) =>
  arr.map((x) => {
    const current = ctx.global.state.getThisArg(ctx.scope)
    const p = current?.["@findPath"]?.(x) ?? ctx.scope
    return joinScope(p, x)
  })

registerRenderer.fromDots = (ctx, arr, render) => {
  const scopes = resolveScope(ctx, arr)
  if (scopes.length > 0) registerRenderer(ctx, scopes, render)
}

registerRenderer.fromTemplate = async (ctx, el, parsedTemplate, render) => {
  await 0 // queueMicrotask

  const filters = { ...ctx.global.filters.value }
  const locals = ctx.global.state.getThisArg(ctx.scope)

  const vars = []
  for (const tokens of parsedTemplate.substitutions) {
    for (const token of tokens) {
      if (token.type === "key") vars.push(token.value)
      else if (token.type === "arg" && isLength(token.value)) {
        vars.push(token.value)
      } else if (token.type === "function") {
        const { value } = token
        filters[value] ??= getParentMethod(el, value) ?? getFilter(value)
      }
    }
  }

  const scopes = new Set(resolveScope(ctx, vars))

  const renderTemplate = template.compile(parsedTemplate, {
    async: true,
    locals,
    filters,
    thisArg: { el, ctx },
  })

  const fn = render
  render = async () => {
    const locals = ctx.global.state.getThisArg(ctx.scope)
    fn(await renderTemplate(locals))
    return "registerRenderer.fromTemplate"
  }

  registerRenderer(ctx, scopes, render)
}
