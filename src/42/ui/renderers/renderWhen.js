/* eslint-disable no-useless-concat */

import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import createRange from "../../fabric/dom/createRange.js"
import register from "../register.js"
import resolve from "../resolve.js"
import expr from "../../system/expr.js"
import isLength from "../../fabric/type/any/is/isLength.js"

const PLACEHOLDER = "[when]"
const { DOCUMENT_FRAGMENT_NODE } = Node

export default function renderWhen(def, ctx) {
  const { when } = def

  def = omit(def, ["when"])

  const el = document.createDocumentFragment()

  let lastChild
  const placeholder = document.createComment(PLACEHOLDER)
  el.append(placeholder)

  const parsed = expr.parse(
    when.startsWith("{" + "{") && when.endsWith("}" + "}")
      ? when.slice(2, -2)
      : when
  )

  const keys = []

  for (const token of parsed) {
    const loc = resolve(ctx, token.value)
    if (token.type === "key") {
      token.value = loc
      keys.push(token.value)
    } else if (
      token.type === "arg" &&
      !token.negated &&
      isLength(token.value) &&
      Array.isArray(ctx.state.get(ctx.scope))
    ) {
      token.type = "key"
      token.value = loc
      keys.push(token.value)
    }
  }

  const check = expr.compile(parsed, { boolean: true, sep: "/" })

  register(ctx, keys, () => {
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
