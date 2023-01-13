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

export default function renderIf(plan, stage) {
  const el = document.createDocumentFragment()

  let lastChild
  let lastRes
  let cancel

  const placeholder = document.createComment(PLACEHOLDER)
  el.append(placeholder)

  const tokens = expr.parse(plan.if)
  const { scopes, actions } = normalizeTokens(tokens, stage)
  const check = expr.compile(tokens, {
    boolean: true,
    async: true,
    delimiter: "/",
    actions,
  })

  const defIf = normalizeDef(omit(plan, ["if"]), stage)
  const typeIf = getType(defIf)
  let defElse
  let typeElse
  if (plan.else) {
    if (typeIf === "object") {
      if ("to" in defIf) plan.else.to ??= defIf.to
      if ("from" in defIf) plan.else.from ??= defIf.from
      if ("animate" in defIf) plan.else.animate ??= defIf.animate
    }

    defElse = plan.else ? normalizeDef(plan.else, stage) : undefined
    typeElse = getType(defElse)
  }

  register(stage, scopes, async () => {
    const res = await check(stage.reactive.state)
    if (res === lastRes) return

    const [plan, type] = res ? [defIf, typeIf] : [defElse, typeElse]

    if (lastChild) {
      cancel?.("renderIf removed")
      cancel = undefined
      const range = new NodesRange(placeholder, lastChild)
      removeRange(
        stage,
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
    if (!plan) return

    cancel = new Canceller(stage.signal)
    const el = render(
      plan,
      {
        ...stage,
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
