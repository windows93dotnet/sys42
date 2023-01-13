// TODO: write real Markdown parser

export default function parseMarkdown(text) {
  const tokens = []

  let cursor = 0

  const makeTokenizer = (tag) => (_, content, index) => {
    const previous = text.slice(cursor, index)
    if (previous) tokens.push(previous)
    tokens.push({ tag, content })
    cursor = index + _.length
    return " ".repeat(_.length)
  }

  text
    .replace(/^### (.*$)/gim, makeTokenizer("h3"))
    .replace(/^## (.*$)/gim, makeTokenizer("h2"))
    .replace(/^# (.*$)/gim, makeTokenizer("h1"))
    .replace(/^> (.*$)/gim, makeTokenizer("blockquote"))
    .replace(/\*\*(.*?)\*\*/gim, makeTokenizer("strong"))
    .replace(/\*(.*?)\*/gim, makeTokenizer("em"))
  // .replace(/!\[(.*?)]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
  // .replace(/\[(.*?)]\((.*?)\)/gim, "<a href='$2'>$1</a>")
  // .replace(/\n$/gim, "<br />")

  if (cursor < text.length) tokens.push(text.slice(cursor))

  return tokens
}
