import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import NodesRange from "../../fabric/range/NodesRange.js"
import removeElements from "./removeElements.js"
import noop from "../../fabric/type/function/noop.js"
import getNodesInRange from "../../fabric/range/getNodesInRange.js"
import register from "../register.js"
import Canceller from "../../fabric/classes/Canceller.js"
import getType from "../../fabric/type/any/getType.js"
import setTemp from "../../fabric/dom/setTemp.js"
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

  const ifPlan = normalizePlan(plan.do ?? omit(plan, ["if", "else"]), stage)
  const ifType = getType(ifPlan)
  let elsePlan
  let elseType
  if (plan.else) {
    if (ifType === "object") {
      if ("animate" in ifPlan) plan.else.animate ??= ifPlan.animate
    }

    elsePlan = plan.else ? normalizePlan(plan.else, stage) : undefined
    elseType = getType(elsePlan)
  }

  register(stage, scopes, async () => {
    const res = await check(stage.reactive.state)
    if (res === lastRes) return

    const [plan, type] = res ? [ifPlan, ifType] : [elsePlan, elseType]

    let remover = noop

    if (lastChild) {
      cancel?.("renderIf removed")
      cancel = undefined
      const plan =
        lastRes === false && elseType === "object" && "animate" in elsePlan
          ? elsePlan
          : ifPlan
      let elements = getNodesInRange(new NodesRange(placeholder, lastChild))
      remover = async () => {
        await removeElements(elements, plan, stage)
        elements.length = 0
        elements = undefined
      }

      lastChild = undefined
    }

    lastRes = res
    if (!plan) {
      remover()
      return
    }

    cancel = new Canceller(stage.signal)
    const newStage = { ...stage, type, cancel, signal: cancel.signal }
    const el = render(plan, newStage, { skipNormalize: true })

    if (el.nodeType === DOCUMENT_FRAGMENT_NODE) {
      lastChild = el.lastChild
      remover()
    } else {
      lastChild = el

      // prevent FOUC
      const restore = setTemp(el, { style: { display: "none" } })
      newStage.reactive.done().then(() => {
        requestAnimationFrame(async () => {
          await remover()
          restore()
        })
      })
    }

    placeholder.after(el)
  })

  return el
}
