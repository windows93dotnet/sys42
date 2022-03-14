import locate from "../../../fabric/locator/locate.js"

export default function compileExpr(rules) {
  if (rules.length === 1) {
    const { key, comparator, value } = rules[0]
    return (target) => Boolean(comparator(locate(target, key), value))
  }

  return (target) =>
    rules.every(({ key, comparator, value }) =>
      comparator(locate(target, key), value)
    )
}
