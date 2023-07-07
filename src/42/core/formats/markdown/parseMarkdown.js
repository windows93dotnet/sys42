// TODO: write real Markdown parser

export default function parseMarkdown(text) {
  const tokens = []

  let cursor = 0

  const makeTokenizer = (tag) => (_, content, index) =>
    handleToken(_, index, { tag, content })

  function handleToken(_, index, plan) {
    const previous = text.slice(cursor, index)
    if (previous) tokens.push({ content: previous })
    tokens.push(plan)
    cursor = index + _.length
    return "-".repeat(_.length)
  }

  text
    .replaceAll(/^#{4} (.*$)/gim, makeTokenizer("h4"))
    .replaceAll(/^### (.*$)/gim, makeTokenizer("h3"))
    .replaceAll(/^## (.*$)/gim, makeTokenizer("h2"))
    .replaceAll(/^# (.*$)/gim, makeTokenizer("h1"))
    .replaceAll(/^> (.*$)/gim, makeTokenizer("blockquote"))
    .replaceAll(/\*\*(.*?)\*\*/gim, makeTokenizer("strong"))
    // .replace(/\*([^*]*?)\*/gim, makeTokenizer("em"))
    // .replace(/ {2}$/gim, (_, index) => handleToken(_, index, { tag: "br" }))
    // .replace(/\n/gim, (_, index) => handleToken(_, index, { tag: "br" }))
    // .replace(/\n\n/gim, (_, index) => handleToken(_, index, { tag: "br" }))
    .replaceAll(/!\[(.*?)]\((.*?)\)/gim, (_, alt, src, index) =>
      handleToken(_, index, { tag: "img", alt, src }),
    )
    .replaceAll(/\[(.*?)]\((.*?)\)/gim, (_, content, href, index) =>
      handleToken(_, index, { tag: "a", href, content }),
    )

  if (cursor < text.length) tokens.push({ content: text.slice(cursor) })

  return tokens
}
