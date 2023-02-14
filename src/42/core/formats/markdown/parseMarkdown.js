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
    .replace(/^#{4} (.*$)/gim, makeTokenizer("h4"))
    .replace(/^### (.*$)/gim, makeTokenizer("h3"))
    .replace(/^## (.*$)/gim, makeTokenizer("h2"))
    .replace(/^# (.*$)/gim, makeTokenizer("h1"))
    .replace(/^> (.*$)/gim, makeTokenizer("blockquote"))
    .replace(/\*\*(.*?)\*\*/gim, makeTokenizer("strong"))
    // .replace(/\*([^*]*?)\*/gim, makeTokenizer("em"))
    // .replace(/ {2}$/gim, (_, index) => handleToken(_, index, { tag: "br" }))
    // .replace(/\n/gim, (_, index) => handleToken(_, index, { tag: "br" }))
    // .replace(/\n\n/gim, (_, index) => handleToken(_, index, { tag: "br" }))
    .replace(/!\[(.*?)]\((.*?)\)/gim, (_, alt, src, index) =>
      handleToken(_, index, { tag: "img", alt, src })
    )
    .replace(/\[(.*?)]\((.*?)\)/gim, (_, content, href, index) =>
      handleToken(_, index, { tag: "a", href, content })
    )

  if (cursor < text.length) tokens.push({ content: text.slice(cursor) })

  return tokens
}
