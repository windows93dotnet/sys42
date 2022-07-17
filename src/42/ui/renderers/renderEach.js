/* eslint-disable max-depth */
import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import createRange from "../../fabric/range/createRange.js"
import removeRange from "./removeRange.js"
import register from "../register.js"
import Canceller from "../../fabric/class/Canceller.js"

const PLACEHOLDER = "[each]"
const ITEM = "[#]"

export default function renderEach(def, ctx) {
  const eachDef = def.each
  def = omit(def, ["each"])

  const el = render(def, ctx)

  let lastItem
  const cancels = []

  const placeholder = document.createComment(PLACEHOLDER)
  el.append(placeholder)

  register(ctx, ctx.scope, (array) => {
    if (!array || !Array.isArray(array) || array.length === 0) {
      if (lastItem) {
        for (const cancel of cancels) cancel()
        cancels.length = 0

        const range = createRange()
        range.setStartAfter(placeholder)
        range.setEndAfter(lastItem)
        removeRange(ctx, range, eachDef)
        lastItem = undefined
      }

      return
    }

    let i = 0
    const { length } = array

    let endItem

    if (lastItem) {
      const l = length - 1
      let node

      const walker = document.createTreeWalker(
        lastItem.parentElement,
        NodeFilter.SHOW_COMMENT
      )

      walker.currentNode = placeholder

      while ((node = walker.nextNode())) {
        if (node.textContent === ITEM) {
          i++

          endItem = node
          if (endItem === lastItem) break

          // remove extra items only
          if (i > l) {
            for (let j = i; j < cancels.length; j++) {
              cancels[j]("renderEach removed")
            }

            cancels.length = i

            const range = createRange()
            range.setStartAfter(endItem)
            range.setEndAfter(lastItem)
            removeRange(ctx, range, eachDef)
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

      fragment.append(
        render(eachDef, {
          ...ctx,
          cancel,
          signal: cancel.signal,
          scope: `${ctx.scope}/${i}`,
        }),
        (lastItem = document.createComment(ITEM))
      )
    }

    if (endItem) endItem.after(fragment)
    else placeholder.after(fragment)
  })

  return el
}
