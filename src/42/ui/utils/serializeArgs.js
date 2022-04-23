import locate from "../../fabric/locator/locate.js"
import parseDotNotation from "../../fabric/locator/parseDotNotation.js"

export default function serializeArgs(event, target, args, locals) {
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

    // TODO: use template
    const tokens = parseDotNotation(arg)
    if (tokens.length > 1 && tokens[0] in meta) {
      return locate.tokens(meta, tokens) ?? locals
        ? locate.tokens(locals, tokens)
        : undefined
    }

    return locals ? locate.tokens(locals, tokens) ?? arg : arg
  })
}
