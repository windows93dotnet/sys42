export default function parseLiteral(str) {
  str = str.trim()
  if (str.startsWith("/") === false) {
    throw new TypeError(`malformed regex literal: ${str}`)
  }

  const end = str.lastIndexOf("/")
  if (end === 0) throw new TypeError(`malformed regex literal: ${str}`)
  const pattern = str.slice(1, end)
  const flag = str.slice(end + 1)
  return flag ? [pattern, flag] : [pattern]
}
