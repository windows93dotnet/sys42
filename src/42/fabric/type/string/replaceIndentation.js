export default function replaceIndentation(str, currentIndent = "") {
  let shortestIndent
  str.replaceAll(/\n+([\t ]*)/g, (_, indent) => {
    if (shortestIndent === undefined) shortestIndent = indent
    else if (indent.length < shortestIndent.length) shortestIndent = indent
  })

  if (shortestIndent !== currentIndent) {
    str = str.replaceAll(
      new RegExp(`\n${shortestIndent}(?!\n)`, "g"),
      `\n${currentIndent}`,
    )
  }

  return str
}
