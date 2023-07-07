export default function replaceIndentation(str, currentIndent = "") {
  let shortestIndent
  str.replace(/\n+([\t ]*)/g, (_, indent) => {
    if (shortestIndent === undefined) shortestIndent = indent
    else if (indent.length < shortestIndent.length) shortestIndent = indent
  })

  if (shortestIndent !== currentIndent) {
    str = str.replace(
      new RegExp(`\n${shortestIndent}(?!\n)`, "g"),
      `\n${currentIndent}`,
    )
  }

  return str
}
