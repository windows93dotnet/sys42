import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import createRange from "../../fabric/dom/createRange.js"
import register from "../register.js"
import { normalizeTokens } from "../normalize.js"
import expr from "../../system/expr.js"

const PLACEHOLDER = "[when]"
const { DOCUMENT_FRAGMENT_NODE } = Node

export default function renderWhen(def, ctx) {
  const { when } = def

  def = omit(def, ["when"])

  const el = document.createDocumentFragment()

  let lastChild
  const placeholder = document.createComment(PLACEHOLDER)
  el.append(placeholder)

  const parsed = expr.parse(when)
  const { scopes, filters } = normalizeTokens(parsed, ctx)
  const check = expr.compile(parsed, {
    boolean: true,
    async: true,
    sep: "/",
    thisArg: ctx,
    filters,
  })

  register(ctx, scopes, () => {
    const res = check(ctx.state.proxy)

    if (res && !lastChild) {
      const el = render(def, ctx)
      lastChild = el.nodeType === DOCUMENT_FRAGMENT_NODE ? el.lastChild : el
      placeholder.after(el)
    } else if (!res && lastChild) {
      const range = createRange()
      range.setStartAfter(placeholder)
      range.setEndAfter(lastChild)
      range.deleteContents()
      lastChild = undefined
    }
  })

  return el
}
