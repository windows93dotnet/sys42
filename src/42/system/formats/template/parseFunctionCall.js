function addArg(args, locals, buffer, jsonParse = JSON.parse) {
  const arg = buffer.trim()
  if (arg) {
    try {
      args.push(jsonParse(arg))
    } catch {
      locals[arg] = args.length
      args.push(undefined)
    }
  }
}

const pairs = {
  '"': '"',
  "'": "'",
  "[": "]",
  "{": "}",
}

const pairsKeys = Object.keys(pairs)

export default function parseFunctionCall(source, jsonParse) {
  let buffer = ""
  let current = 0

  let state
  let name = ""
  const args = []
  const locals = {}

  while (current < source.length) {
    const char = source[current]

    if (state === "args") {
      if (char === ",") {
        addArg(args, locals, buffer, jsonParse)
        buffer = ""
        current++
        continue
      }

      if (char === ")") {
        addArg(args, locals, buffer, jsonParse)
        break
      }
    } else if (char === "(") {
      state = "args"
      name = buffer.trim()
      buffer = ""
      current++
      continue
    }

    if (pairsKeys.includes(state)) {
      if (char === pairs[state]) {
        state = "args"
        addArg(args, locals, buffer + char, jsonParse)
        buffer = ""
        current++
        continue
      }
    } else if (pairsKeys.includes(char)) state = char

    buffer += char
    current++
  }

  name ||= buffer.trim()

  return { name, args, locals }
}
