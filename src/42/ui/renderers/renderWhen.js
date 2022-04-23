/* eslint-disable no-useless-concat */

import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import createRange from "../../fabric/dom/createRange.js"
import registerRenderer from "../utils/registerRenderer.js"
import expr from "../../system/expr.js"
import isLength from "../../fabric/type/any/is/isLength.js"

export default function renderWhen(def, ctx, parent, textMaker) {
  const when = def.when.trim()
  const parsed = expr.parse(
    when.startsWith("{" + "{") && when.endsWith("}" + "}")
      ? when.slice(2, -2)
      : when
  )
  const check = expr.compile(parsed)

  def = omit(def, ["when"])

  let lastChild
  const placeholder = document.createComment(`[when]`)
  parent.append(placeholder)

  const locals = ctx.global.state.getThisArg(ctx.scope)
  const keys = []

  for (const { type, value, negated } of parsed) {
    if (type === "key") keys.push(value)
    else if (!negated && isLength(value) && Array.isArray(locals)) {
      keys.push(value)
    }
  }

  registerRenderer.fromDots(ctx, keys, () => {
    const locals = ctx.global.state.getThisArg(ctx.scope)
    const res = check(locals)

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
