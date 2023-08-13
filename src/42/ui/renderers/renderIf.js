import { normalizePlan, normalizeTokens } from "../normalize.js"
import render from "../render.js"
import register from "../register.js"
import removeElements from "../utils/removeElements.js"
import expr from "../../core/expr.js"
import omit from "../../fabric/type/object/omit.js"
import NodesRange from "../../fabric/range/NodesRange.js"
import noop from "../../fabric/type/function/noop.js"
import getNodesInRange from "../../fabric/range/getNodesInRange.js"
import Canceller from "../../fabric/classes/Canceller.js"
import getType from "../../fabric/type/any/getType.js"
import setTemp from "../../fabric/dom/setTemp.js"

const PLACEHOLDER = "[if]"
const { ELEMENT_NODE, DOCUMENT_FRAGMENT_NODE } = Node

export default function renderIf(plan, stage) {
  const el = document.createDocumentFragment()

  let lastChild
  let lastRes
  let cancel
  let remover
  let elements

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
  const ifSteps = stage.steps
  let elsePlan
  let elseType
  let elseSteps
  if (plan.else) {
    if (ifType === "object") {
      if ("animate" in ifPlan) plan.else.animate ??= ifPlan.animate
    }

    elsePlan = normalizePlan(plan.else, stage)
    elseType = getType(elsePlan)
    elseSteps = ifSteps + "[else]"
  }

  register(stage, scopes, async () => {
    const res = await check(stage.reactive.state)
    if (res === lastRes) return

    let plan
    let type
    let steps

    if (res) {
      plan = ifPlan
      type = ifType
      steps = ifSteps
    } else {
      plan = elsePlan
      type = elseType
      steps = elseSteps
    }

    if (lastChild) {
      elements = getNodesInRange(new NodesRange(placeholder, lastChild))

      cancel?.("renderIf removed")
      cancel = undefined
      lastChild = undefined

      const plan =
        lastRes === false && elseType === "object" && "animate" in elsePlan
          ? elsePlan
          : ifPlan

      remover = async () => {
        await removeElements(elements, plan, stage)
        elements.length = 0
        elements = undefined
      }
    } else remover = noop

    lastRes = res
    if (!plan) {
      remover()
      return
    }

    cancel = new Canceller(stage.signal)
    const newStage = { ...stage, type, steps, cancel, signal: cancel.signal }
    const el = render(plan, newStage, { skipNormalize: true })

    if (el.nodeType === DOCUMENT_FRAGMENT_NODE) {
      lastChild = el.lastChild
      remover()
    } else {
      lastChild = el

      if (elsePlan && el.nodeType === ELEMENT_NODE) {
        // prevent FOUC
        const restore = setTemp(el, { style: { display: "none" } })
        newStage.pendingDone().then(() => {
          requestAnimationFrame(async () => {
            restore()
            await remover()
          })
        })
      } else {
        remover()
      }
    }

    placeholder.after(el)
  })

  return el
}
