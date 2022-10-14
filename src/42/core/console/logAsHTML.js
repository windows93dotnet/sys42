import parseLogTemplate from "./parseLogTemplate.js"

export function formatStyle(color, text) {
  const span = document.createElement("span")
  span.className = "ansi-" + color.split(".").join(" ansi-")
  if (text) span.append(text)
  return span
}

export function formatLog(tokens) {
  const out = document.createDocumentFragment()
  let span = document.createElement("span")
  for (const { type, content } of tokens) {
    if (type === "style") {
      out.append(span)
      span = formatStyle(content)
    } else {
      span.append(content)
    }
  }

  out.append(span)

  return out
}

export default function logHTML(str) {
  return formatLog(parseLogTemplate(str))
}
