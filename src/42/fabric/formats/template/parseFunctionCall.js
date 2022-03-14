function addArg(args, locals, buffer, jsonParser = JSON.parse) {
  const arg = buffer.trim()
  if (arg) {
    try {
      args.push(jsonParser(arg))
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

export default function parseFunctionCall(source, jsonParser) {
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
        addArg(args, locals, buffer, jsonParser)
        buffer = ""
        current++
        continue
      }

      if (char === ")") {
        addArg(args, locals, buffer, jsonParser)
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
        addArg(args, locals, buffer + char, jsonParser)
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
