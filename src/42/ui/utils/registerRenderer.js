import template from "../../system/formats/template.js"
import filter from "../../fabric/filter.js"
import joinScope from "./joinScope.js"

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

const dotNotation = (ctx, arr) => arr.map((x) => joinScope(ctx.scope, x))

registerRenderer.fromDots = (ctx, arr, render) => {
  const scopes = dotNotation(ctx, arr)
  if (scopes.length > 0) registerRenderer(ctx, scopes, render)
}

registerRenderer.fromTemplate = (ctx, parsedTemplate, render) => {
  const filters = { ...ctx.global.filters.value }
  const filtersNames = []
  const filtersLocals = parsedTemplate.filters.flatMap(
    (x) =>
      x?.flatMap(({ name, locals }) => {
        filtersNames.push(name)
        return Object.keys(locals)
      }) ?? []
  )

  const vars = [...parsedTemplate.substitutions, ...filtersLocals]
  const scopes = new Set(dotNotation(ctx, vars))

  const modules = []
  if (filtersNames) {
    for (const filtersName of filtersNames) {
      if (filtersName in filters === false) {
        if (ctx.component && filtersName in ctx.component) {
          filters[filtersName] = ctx.component[filtersName]
        } else {
          modules.push(
            filter(filtersName).then((filter) => {
              if (filter) filters[filtersName] = filter
            })
          )
        }
      }
    }
  }

  const fn = render
  render = async () => {
    await Promise.all(modules)
    fn(
      await template.format.async(
        parsedTemplate,
        ctx.global.rack.get(ctx.scope),
        filters
      )
    )
  }

  if (scopes.size > 0) registerRenderer(ctx, scopes, render)
}
