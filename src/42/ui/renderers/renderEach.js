/* eslint-disable complexity */
/* eslint-disable max-depth */
import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import NodesRange from "../../fabric/range/NodesRange.js"
import removeRange from "./removeRange.js"
import register from "../register.js"
import Canceller from "../../fabric/classes/Canceller.js"
import { normalizeDefNoCtx } from "../normalize.js"
import { arrayDiff } from "../../fabric/json/diff.js"
import renderAnimation from "./renderAnimation.js"

const PLACEHOLDER = "[each]"
const ITEM = "[#]"

function cancelExtraItems(i, cancels) {
  const x = i
  for (let l = cancels.length; i < l; i++) cancels[i]("renderEach removed")
  cancels.length = x
}

export default function renderEach(def, ctx) {
  const eachDef = normalizeDefNoCtx(def.each)
  def = omit(def, ["each"])

  const el = render(def, ctx)

  let lastItem
  const cancels = []

  const placeholder = document.createComment(PLACEHOLDER)
  el.append(placeholder)

  let scopeChain
  if (ctx.scopeChain.length > 0) {
    scopeChain = structuredClone(ctx.scopeChain)
    scopeChain.push({ scope: ctx.scope })
  }

  let prevArray
  const replacedIndices = []
  const removedIndices = []
  const removedElements = []
  const addedIndices = []
  const addedElements = []

  const animTo = eachDef?.animate?.to
  const animFrom = eachDef?.animate?.from

  register(ctx, ctx.scope, (array) => {
    const container = lastItem?.parentElement

    if (!array || !Array.isArray(array) || array.length === 0) {
      if (lastItem) {
        for (const cancel of cancels) cancel()
        cancels.length = 0

        const range = new NodesRange(placeholder, lastItem, container)
        removeRange(ctx, range, eachDef)
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
                renderAnimation(ctx, inert, "to", animTo).then(() => {
                  inert.remove()
                  recycled.style.display = display
                  renderAnimation(ctx, recycled, "from", animFrom)
                })
              } else renderAnimation(ctx, recycled, "from", animFrom)
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

                  renderAnimation(ctx, inert, "to", animTo) //
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
      const cancel = new Canceller(ctx.signal)
      cancels.push(cancel)

      let itemDef = eachDef

      if (addedElements.length > 0) {
        const recycled = addedElements.pop()
        renderAnimation(ctx, recycled, "from", animFrom)
        itemDef = { ...eachDef, animate: { to: animTo } }
      }

      fragment.append(
        render(
          itemDef,
          {
            ...ctx,
            cancel,
            signal: cancel.signal,
            scope: `${ctx.scope}/${i}`,
            steps: `${ctx.steps},[${i}]`,
            scopeChain,
          },
          { skipNoCtx: true }
        ),
        (lastItem = document.createComment(ITEM))
      )
    }

    if (endItem) endItem.after(fragment)
    else placeholder.after(fragment)
  })

  return el
}
