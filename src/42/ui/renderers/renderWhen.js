import render from "../render.js"
import createRange from "../../fabric/dom/createRange.js"
import registerRenderer from "../utils/registerRenderer.js"
import expr from "../../fabric/formats/expr.js"

export default function renderWhen(def, ctx, parent, textMaker) {
  const parsed = expr.parse(def.when)
  const check = expr.compile(parsed)

  let lastChild
  const placeholder = document.createComment(`[when]`)
  parent.append(placeholder)

  delete def.when

  registerRenderer.fromDots(
    ctx,
    parsed.map(({ key }) => key),
    () => {
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
    }
  )

  return parent
}
