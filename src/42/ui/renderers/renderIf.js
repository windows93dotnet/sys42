import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import NodesRange from "../../fabric/range/NodesRange.js"
import removeRange from "./removeRange.js"
import register from "../register.js"
import Canceller from "../../fabric/classes/Canceller.js"
import getType from "../../fabric/type/any/getType.js"
import { normalizePlan, normalizeTokens } from "../normalize.js"
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

  const ifPlan = normalizePlan(omit(plan, ["if"]), stage)
  const ifType = getType(ifPlan)
  let elsePlan
  let elseType
  if (plan.else) {
    if (ifType === "object") {
      if ("to" in ifPlan) plan.else.to ??= ifPlan.to
      if ("from" in ifPlan) plan.else.from ??= ifPlan.from
      if ("animate" in ifPlan) plan.else.animate ??= ifPlan.animate
    }

    elsePlan = plan.else ? normalizePlan(plan.else, stage) : undefined
    elseType = getType(elsePlan)
  }

  register(stage, scopes, async () => {
    const res = await check(stage.reactive.state)
    if (res === lastRes) return

    const [plan, type] = res ? [ifPlan, ifType] : [elsePlan, elseType]

    if (lastChild) {
      cancel?.("renderIf removed")
      cancel = undefined
      const plan =
        lastRes === false &&
        elseType === "object" &&
        ("to" in elsePlan || "animate" in elsePlan)
          ? elsePlan
          : ifPlan
      const range = new NodesRange(placeholder, lastChild)
      removeRange(range, plan, stage)
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
