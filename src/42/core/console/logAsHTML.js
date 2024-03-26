import parseLogTemplate from "./parseLogTemplate.js"

export function formatStyle(color) {
  return "ansi-" + color.split(".").join(" ansi-")
}

export function formatLog(tokens) {
  const out = document.createDocumentFragment()

  const state = { 0: undefined }

  for (const { type, content, nested } of tokens) {
    if (type === "text") {
      const span = document.createElement("span")
      if (state[nested]) span.className = state[nested]
      span.append(content)
      out.append(span)
    } else {
      state[nested] = formatStyle(content)
    }
  }

  return out
}

export function logAsHTML(str) {
  return formatLog(parseLogTemplate(str))
}

export default logAsHTML
