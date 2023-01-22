import parseLogTemplate from "./parseLogTemplate.js"

export function formatStyle(color) {
  return {
    tag: "span.ansi-" + color.split(".").join(".ansi-"),
    content: "",
  }
}

export function formatLog(tokens) {
  const out = []
  let span = { tag: "span", content: "" }
  for (const { type, content } of tokens) {
    if (type === "style") {
      if (span.content) out.push(span)
      span = formatStyle(content)
    } else {
      span.content += content
    }
  }

  out.push(span)

  return out
}

export default function logAsContent(str) {
  return formatLog(parseLogTemplate(str))
}
