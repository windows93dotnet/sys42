export default function formatTemplate(
  { strings, substitutions, filters },
  locals,
  options = {}
) {
  options.locate ??= (obj, key) => obj?.[key]
  options.jsonParse ??= JSON.parse
  options.filters ??= {}
  options.async ??= false

  const { locate, jsonParse } = options

  const out = [strings[0]]

  for (let i = 0, l = substitutions.length; i < l; i++) {
    const filterKeys = filters?.[i]
    const key = substitutions[i]
    let res = key === "." ? locals : locate(locals, key)

    if (res === undefined) {
      try {
        res = jsonParse(key)
        if (typeof res === "number" && Array.isArray(locals)) res = ""
      } catch {
        res = ""
      }
    }

    if (filterKeys !== undefined) {
      let first = true
      for (const { name, args, locals: filterLocals } of filterKeys) {
        for (const [key, index] of Object.entries(filterLocals)) {
          args[index] = locate(locals, key)
        }

        res =
          (key === undefined && first
            ? locate(options.filters, name)?.(...args)
            : locate(options.filters, name)?.(res, ...args)) ?? ""

        first = false
      }
    }

    out.push(res, strings[i + 1] ?? "")
  }

  if (options.async) return Promise.all(out).then((x) => x.join(""))

  return out.join("")
}

export async function formatTemplateAsync(parsed, locals, options = {}) {
  options.async = true
  return formatTemplate(parsed, locals, options)
}

formatTemplate.async = formatTemplateAsync
