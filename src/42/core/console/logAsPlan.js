import parseLogTemplate from "./parseLogTemplate.js"

export function formatStyle(color) {
  return ".ansi-" + color.split(".").join(".ansi-")
}

export function formatLog(tokens) {
  const out = []

  const state = { 0: undefined }

  for (const { type, content, nested } of tokens) {
    if (type === "text") {
      const span = { tag: "span", content }
      if (state[nested]) span.tag += state[nested]
      out.push(span)
    } else {
      state[nested] = formatStyle(content)
    }
  }

  return out
}

export function logAsPlan(str) {
  return formatLog(parseLogTemplate(str))
}

export default logAsPlan
