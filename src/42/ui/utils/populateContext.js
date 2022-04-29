import schemaToContent from "./schemaToContent.js"
import generateSchema from "../../fabric/type/json/generateSchema.js"
import getBoundSchema from "../../fabric/type/json/getBoundSchema.js"

export default function populateContext(ctx, def) {
  if ("scope" in def) ctx.scope = def.scope

  if (def.data) {
    const type = typeof def.data
    if (type === "function") {
      ctx.undones.push(
        (async () => {
          const res = await def.data()
          ctx.global.state.set(ctx.scope, res)
        })()
      )
    } else if (type === "object") {
      ctx.global.rack.assign(ctx.scope, def.data)
    } else throw new TypeError(`data must be an array or object: ${type}`)

    if ("schema" in def === false && "content" in def === false) {
      def.schema = generateSchema(def.data)
    }
  }

  if ("schema" in def) {
    ctx.global.schema ??= def.schema

    ctx.control =
      typeof def.schema === "string"
        ? getBoundSchema(ctx.global.schema, def.schema)
        : { schema: def.schema, required: def.schema.required }

    if ("content" in def === false && !def.type?.startsWith("ui-")) {
      def.content = schemaToContent(ctx.control.schema)
    }
  } else {
    ctx.control = {}
  }

  if (def.actions) {
    ctx.global.actions.assign(
      ctx.scope,
      assignFunctions(ctx, ctx.scope, def.actions)
    )
  }

  if (def.filters) {
    ctx.global.filters.assign(
      ctx.scope,
      assignFunctions(ctx, ctx.scope, def.filters)
    )
  }
}

function assignFunctions(ctx, scope, actions) {
  const thisArg = ctx.global.state.getProxy(scope)
  const entries = []
  for (const [key, val] of Object.entries(actions)) {
    // TODO: add reserved prefix error for data too
    if (key.startsWith("$")) {
      throw new Error(`Reserved prefix "$" is not allowed: ${key}`)
    }

    const type = typeof val
    if (type === "function") {
      entries.push([key, val.bind(thisArg)])
    } else if (type === "object") {
      entries.push([key, assignFunctions(ctx, `${scope}.${key}`, val)])
    }
  }

  return Object.fromEntries(entries)
}
