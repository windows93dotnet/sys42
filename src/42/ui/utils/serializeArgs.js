import locate from "../../fabric/access/locate.js"
import parseDotNotation from "../../fabric/access/parseDotNotation.js"

export default function serializeArgs(event, target, args) {
  let rect

  const meta = {
    e: event,
    event,
    target,
    get rect() {
      rect ??= target.getBoundingClientRect()
      return rect
    },
  }

  return args.map((arg) => {
    if (typeof arg !== "string") return arg

    const tokens = parseDotNotation(arg)
    if (tokens.length > 1 && tokens[0] in meta) {
      return locate.tokens(meta, tokens)
    }

    return arg
  })
}
