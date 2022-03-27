import render from "../render.js"
import createRange from "../../fabric/dom/createRange.js"
import registerRenderer from "../utils/registerRenderer.js"
import expr from "../../system/expr.js"
import isLength from "../../fabric/type/any/is/isLength.js"

export default function renderWhen(def, ctx, parent, textMaker) {
  const parsed = expr.parse(def.when)
  const check = expr.compile(parsed)

  let lastChild
  const placeholder = document.createComment(`[when]`)
  parent.append(placeholder)

  delete def.when

  const locals = ctx.global.rack.get(ctx.scope)
  const keys = []

  for (const { type, value, negated } of parsed) {
    if (type === "key") keys.push(value)
    else if (!negated && isLength(value) && Array.isArray(locals)) {
      keys.push(value)
    }
  }

  registerRenderer.fromDots(ctx, keys, () => {
    const res = check(ctx.global.rack.get(ctx.scope))

    if (res && !lastChild) {
      const fragment = render(def, ctx, undefined, textMaker)
      lastChild = fragment.lastChild
      placeholder.after(fragment)
    } else if (lastChild) {
      const range = createRange()
      range.setStartAfter(placeholder)
      range.setEndAfter(lastChild)
      range.deleteContents()
      lastChild = undefined
    }
  })

  return parent
}
