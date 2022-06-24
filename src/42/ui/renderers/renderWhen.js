import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import createRange from "../../fabric/dom/createRange.js"
import register from "../register.js"
import { normalizeTokens } from "../normalize.js"
import expr from "../../system/expr.js"

const PLACEHOLDER = "[when]"
const { DOCUMENT_FRAGMENT_NODE } = Node

export default function renderWhen(def, ctx) {
  const el = document.createDocumentFragment()

  let lastChild
  let lastRes
  const placeholder = document.createComment(PLACEHOLDER)
  el.append(placeholder)

  const parsed = expr.parse(def.when)
  const { scopes, filters } = normalizeTokens(parsed, ctx)
  const check = expr.compile(parsed, {
    boolean: true,
    async: true,
    sep: "/",
    thisArg: ctx,
    filters,
  })

  def = omit(def, ["when"])

  register(ctx, scopes, async () => {
    const res = await check(ctx.state.proxy)

    if (res === lastRes) return
    lastRes = res

    if (lastChild) {
      const range = createRange()
      range.setStartAfter(placeholder)
      range.setEndAfter(lastChild)
      range.deleteContents()
      lastChild = undefined
    }

    let el
    if (res) {
      el = render(def, ctx)
    } else if (def.else) {
      el = render(def.else, ctx)
    } else return

    lastChild = el.nodeType === DOCUMENT_FRAGMENT_NODE ? el.lastChild : el
    placeholder.after(el)
  })

  return el
}
