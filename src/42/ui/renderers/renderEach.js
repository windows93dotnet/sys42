/* eslint-disable complexity */
/* eslint-disable max-depth */
import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import NodesRange from "../../fabric/range/NodesRange.js"
import removeRange from "./removeRange.js"
import register from "../register.js"
import Canceller from "../../fabric/classes/Canceller.js"
import { normalizePlanWithoutStage } from "../normalize.js"
import { arrayDiff } from "../../fabric/json/diff.js"
import renderAnimation from "./renderAnimation.js"
// import nextCycle from "../../fabric/type/promise/nextCycle.js"

const PLACEHOLDER = "[each]"
const ITEM = "[#]"

function cancelExtraItems(i, cancels) {
  const newLength = i
  for (let l = cancels.length; i < l; i++) cancels[i]("renderEach removed")
  cancels.length = newLength
}

export default function renderEach(plan, stage) {
  const eachPlan = normalizePlanWithoutStage(plan.each)
  plan = omit(plan, ["each"])

  /* let renderFunction

  if (typeof eachPlan === "function") {
    renderFunction = eachPlan
  } else if (typeof eachPlan?.render === "function") {
    const eachPlanRender = eachPlan.render
    delete eachPlan.render
    renderFunction = (...args) => ({ ...eachPlan, ...eachPlanRender(...args) })
  } else if (eachPlan?.render === true) {
    delete eachPlan.render
    renderFunction = (item) => ({ ...eachPlan, ...objectifyPlan(item) })
  } */

  const el = render(plan, stage)

  let lastItem
  const cancels = []

  const placeholder = document.createComment(PLACEHOLDER)
  el.append(placeholder)

  let scopeChain
  if (stage.scopeChain.length > 0) {
    scopeChain = structuredClone(stage.scopeChain)
    scopeChain.push({ scope: stage.scope })
  }

  let prevArray
  const replacedIndices = []
  const removedIndices = []
  const removedElements = []
  const addedIndices = []
  const addedElements = []

  const animTo = eachPlan?.animate?.to
  const animFrom = eachPlan?.animate?.from

  register(stage, stage.scope, async (array) => {
    const container = lastItem?.parentElement

    if (!array || !Array.isArray(array) || array.length === 0) {
      if (lastItem) {
        for (const cancel of cancels) cancel()
        cancels.length = 0

        const range = new NodesRange(placeholder, lastItem, container)
        removeRange(range, eachPlan, stage)
        lastItem = undefined
      }

      return
    }

    let i = 0
    const { length } = array

    if (animTo || animFrom) {
      if (prevArray) {
        const changes = arrayDiff(prevArray, array)
        replacedIndices.length = 0
        removedIndices.length = 0
        removedElements.length = 0
        addedIndices.length = 0
        addedElements.length = 0
        for (const { op, path } of changes) {
          const index = Number(path.slice(1))
          if (op === "remove") removedIndices.push(index)
          if (op === "add") addedIndices.push(index)
          if (op === "replace") replacedIndices.push(index)
        }
      }

      prevArray = [...array]
    }

    let endItem

    if (lastItem) {
      const l = length - 1
      let node

      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_COMMENT
      )

      walker.currentNode = placeholder

      while ((node = walker.nextNode())) {
        if (node.textContent === ITEM) {
          if (animTo && removedIndices.includes(i)) {
            removedElements.push(node.previousSibling)
          }

          if (animFrom) {
            if (addedIndices.includes(i)) {
              addedElements.push(node.previousSibling)
            }

            if (replacedIndices.includes(i)) {
              const recycled = node.previousSibling
              if (animTo) {
                const inert = recycled.cloneNode(true)
                recycled.before(inert)
                const { display } = recycled.style
                recycled.style.display = "none"
                renderAnimation(stage, inert, "to", animTo).then(() => {
                  inert.remove()
                  recycled.style.display = display
                  renderAnimation(stage, recycled, "from", animFrom)
                })
              } else renderAnimation(stage, recycled, "from", animFrom)
            }
          }

          i++

          endItem = node
          if (endItem === lastItem) break

          if (i > l) {
            cancelExtraItems(i, cancels)

            if (animTo) {
              const range = new NodesRange(endItem, lastItem, container)
              for (const inert of range.nodes) {
                if (inert.nodeType === Node.ELEMENT_NODE) {
                  const recycled = removedElements.shift()
                  if (recycled) {
                    inert.replaceChildren(
                      ...recycled.cloneNode(true).childNodes
                    )
                    recycled.before(inert)
                  } else {
                    // TODO: avoid this
                    inert.replaceChildren(...inert.cloneNode(true).childNodes)
                  }

                  renderAnimation(stage, inert, "to", animTo) //
                    .then(() => inert.remove())
                } else inert.remove()
              }
            } else {
              const range = new NodesRange(endItem, lastItem, container)
              range.deleteContents()
            }

            lastItem = endItem
            break
          }
        }
      }
    }

    const fragment = document.createDocumentFragment()

    for (; i < length; i++) {
      const cancel = new Canceller(stage.signal)
      cancels.push(cancel)

      let itemDef = eachPlan

      // if (renderFunction) {
      //   itemDef = renderFunction(array[i], i, array)
      // }

      if (addedElements.length > 0) {
        const recycled = addedElements.pop()
        renderAnimation(stage, recycled, "from", animFrom)
        itemDef = { ...eachPlan, animate: { to: animTo } }
      }

      fragment.append(
        render(
          itemDef,
          {
            ...stage,
            cancel,
            signal: cancel.signal,
            scope: `${stage.scope}/${i}`,
            steps: `${stage.steps},[${i}]`,
            scopeChain,
          },
          { skipNoStage: true }
        ),
        (lastItem = document.createComment(ITEM))
      )

      // await nextCycle()
    }

    if (endItem) endItem.after(fragment)
    else placeholder.after(fragment)
  })

  return el
}
