import parseLogTemplate from "./parseLogTemplate.js"

// TODO: make parseLogTemplate returns ui definition

export function formatStyle(color) {
  return {
    tag: "span.ansi-" + color.split(".").join(".ansi-"),
    content: "",
  }
}

export function formatLog(tokens) {
  const out = []
  let span = { tag: "span", content: "" }
  for (const { type, text } of tokens) {
    if (type === "style") {
      if (span.content) out.push(span)
      span = formatStyle(text)
    } else {
      span.content += text
    }
  }

  out.push(span)

  return out
}

export default function logAsContent(str) {
  return formatLog(parseLogTemplate(str))
}
