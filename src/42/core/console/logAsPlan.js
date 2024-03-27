import normalizeHref from "./normalizeHref.js"
import parseLogTemplate from "./parseLogTemplate.js"

export function formatStyle(color) {
  return ".ansi-" + color.split(".").join(".ansi-")
}

const tag = "span"

export function formatLog(tokens) {
  const root = []
  let current = root

  const state = { 0: undefined }

  let href

  for (let { type, content, nested } of tokens) {
    const hasHref = href !== undefined

    if (!hasHref && content.startsWith("[](")) {
      href = ""
      const link = { tag: "a.ansi--link", content: [] }
      root.push(link)
      current = link.content
      content = content.slice(3)
      if (!content) continue
    }

    if (type === "text") {
      if (hasHref) {
        if (content.startsWith(")")) {
          root.at(-1).href = normalizeHref(href)
          current = root
          content = content.slice(1)
          href = undefined
          if (!content) continue
        } else href += content
      }

      const plan = { tag, content }
      if (state[nested]) plan.tag += state[nested]
      current.push(plan)
    } else {
      state[nested] = formatStyle(content)
    }
  }

  return root
}

export function logAsPlan(str) {
  return formatLog(parseLogTemplate(str))
}

export default logAsPlan
