// TODO: write real Markdown parser

// function parseMarkdown(markdownText) {
//   const htmlText = markdownText
//     .replace(/^### (.*$)/gim, "<h3>$1</h3>")
//     .replace(/^## (.*$)/gim, "<h2>$1</h2>")
//     .replace(/^# (.*$)/gim, "<h1>$1</h1>")
//     .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
//     .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
//     .replace(/\*(.*)\*/gim, "<em>$1</em>")
//     .replace(/!\[(.*?)]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
//     .replace(/\[(.*?)]\((.*?)\)/gim, "<a href='$2'>$1</a>")
//     .replace(/\n$/gim, "<br />")

//   return htmlText
// }

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
    .replace(/\*\*(.*?)\*\*/gim, makeTokenizer("strong"))
    .replace(/\*(.*?)\*/gim, makeTokenizer("em"))

  if (cursor < text.length) tokens.push(text.slice(cursor))

  return tokens
}
