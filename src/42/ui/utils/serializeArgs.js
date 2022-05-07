import expr from "../../system/expr.js"

export default function serializeArgs(event, target, args, locals) {
  const meta = {
    event,
    target,
    e: event,
    el: target,
    get rect() {
      return target.getBoundingClientRect()
    },
  }

  return args.map((arg) => {
    if (typeof arg !== "string") return arg
    const get = expr.evaluate(arg)
    return get(meta) ?? get(locals) ?? arg
  })
}
