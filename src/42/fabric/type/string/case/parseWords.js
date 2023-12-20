export function parseWords(source, each = (x) => x) {
  let current = 0
  const tokens = []
  let buffer = ""
  let isUppercase = false

  function flush() {
    tokens.push(each(buffer, tokens.length))
    buffer = ""
  }

  while (current < source.length) {
    const code = source.charCodeAt(current)

    if (code > 64 /* A */ && code < 91 /* Z */) {
      if (!isUppercase && buffer) flush()
      isUppercase = true
      buffer += String.fromCharCode(code)
    } else if (
      (code > 47 /* 0 */ && code < 58) /* 9 */ ||
      (code > 96 /* a */ && code < 123) /* z */
    ) {
      isUppercase = false
      buffer += String.fromCharCode(code)
    } else if (buffer) {
      flush()
    }

    current++
  }

  if (buffer) tokens.push(each(buffer, tokens.length))
  return tokens
}

export default parseWords
