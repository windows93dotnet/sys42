export default function parseTagSelector(source, attrs = {}, tag = "div") {
  const out = { tag, attrs }

  if (!source) return out

  let buffer = ""
  let current = 0

  let type = "tag"
  let lastCharEscaped = false

  const flush = () => {
    if (type === "id") out.attrs.id ??= buffer
    else if (type === "class") {
      if ("class" in out.attrs === false) out.attrs.class = [buffer]
      else if (typeof out.attrs.class === "string") {
        out.attrs.class += ` ${buffer}`
      } else if (Array.isArray(out.attrs.class)) out.attrs.class.push(buffer)
      else out.attrs.class[buffer] = true
    } else if (buffer && type === "tag") out.tag = buffer
    buffer = ""
  }

  while (current < source.length) {
    const char = source[current]

    if (char === "\\") {
      lastCharEscaped = true
      const nextChar = source[current + 1]
      if (nextChar !== "{" && nextChar !== "}") buffer += char
      current++
      continue
    }

    if (lastCharEscaped) {
      lastCharEscaped = false
      buffer += char
      current++
      continue
    }

    if (char === ".") {
      flush()
      type = "class"
      current++
      continue
    }

    if (char === "#") {
      flush()
      type = "id"
      current++
      continue
    }

    buffer += char
    current++
  }

  flush()

  return out
}
