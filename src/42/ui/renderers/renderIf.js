import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import NodesRange from "../../fabric/range/NodesRange.js"
import removeRange from "./removeRange.js"
import register from "../register.js"
import Canceller from "../../fabric/classes/Canceller.js"
import getType from "../../fabric/type/any/getType.js"
import { normalizeDef, normalizeTokens } from "../normalize.js"
import expr from "../../core/expr.js"

const PLACEHOLDER = "[if]"
const { DOCUMENT_FRAGMENT_NODE } = Node

export default function renderIf(def, ctx) {
  const el = document.createDocumentFragment()

  let lastChild
  let lastRes
  let cancel

  const placeholder = document.createComment(PLACEHOLDER)
  el.append(placeholder)

  const parsed = expr.parse(def.if)
  const { scopes, actions } = normalizeTokens(parsed, ctx)
  const check = expr.compile(parsed, {
    boolean: true,
    async: true,
    delimiter: "/",
    actions,
  })

  const defIf = normalizeDef(omit(def, ["if"]), ctx)
  const typeIf = getType(defIf)
  let defElse
  let typeElse
  if (def.else) {
    if (typeIf === "object") {
      if ("to" in defIf) def.else.to ??= defIf.to
      if ("from" in defIf) def.else.from ??= defIf.from
      if ("animate" in defIf) def.else.animate ??= defIf.animate
    }

    defElse = def.else ? normalizeDef(def.else, ctx) : undefined
    typeElse = getType(defElse)
  }

  register(ctx, scopes, async () => {
    const res = await check(ctx.reactive.state)
    if (res === lastRes) return

    const [def, type] = res ? [defIf, typeIf] : [defElse, typeElse]

    if (lastChild) {
      cancel?.("renderIf removed")
      cancel = undefined
      const range = new NodesRange(placeholder, lastChild)
      removeRange(
        ctx,
        range,
        lastRes === false &&
          typeElse === "object" &&
          ("to" in defElse || "animate" in defElse)
          ? defElse
          : defIf
      )
      lastChild = undefined
    }

    lastRes = res
    if (!def) return

    cancel = new Canceller(ctx.signal)
    const el = render(
      def,
      {
        ...ctx,
        type,
        cancel,
        signal: cancel.signal,
      },
      { skipNormalize: true }
    )

    lastChild = el.nodeType === DOCUMENT_FRAGMENT_NODE ? el.lastChild : el
    placeholder.after(el)
  })

  return el
}
