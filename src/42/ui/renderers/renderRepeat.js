import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import createRange from "../../fabric/dom/createRange.js"
import registerRenderer from "../utils/registerRenderer.js"
import makeNewContext from "../utils/makeNewContext.js"

export default function renderRepeat(def, ctx, parent, textMaker) {
  const { repeat } = def
  def = omit(def, ["repeat"])

  let container = render(def, ctx, undefined, textMaker)

  if (container.firstChild) {
    container = container.firstChild
    parent.append(container)
  } else {
    container = parent
  }

  let lastChild
  const placeholder = document.createComment(`[repeat]`)
  container.append(placeholder)

  registerRenderer(ctx, ctx.scope, () => {
    const array = ctx.global.rack.get(ctx.scope)

    if (!array || !Array.isArray(array) || array.length === 0) {
      if (lastChild) {
        const range = createRange()
        range.setStartAfter(placeholder)
        range.setEndAfter(lastChild)
        range.deleteContents()
        lastChild = undefined
      }

      return
    }

    let i = 0
    const { length } = array

    let lastPrevious

    if (lastChild) {
      const walker = document.createTreeWalker(
        lastChild.parentElement,
        NodeFilter.SHOW_COMMENT
      )

      const l = length - 1
      i = 0

      while (walker.nextNode()) {
        const { currentNode } = walker

        if (currentNode.textContent === "[#]") {
          lastPrevious = currentNode

          // remove extra items only
          if (++i > l) {
            const range = createRange()
            range.setStartAfter(lastPrevious)
            range.setEndAfter(lastChild)
            range.deleteContents()
            lastChild = lastPrevious
            break
          }
        }

        if (currentNode === lastChild) break
      }
    }

    const fragment = document.createDocumentFragment()

    for (; i < length; i++) {
      const newCtx = makeNewContext(ctx)
      newCtx.scope = `${newCtx.scope}.${i}`
      render(repeat, newCtx, fragment, textMaker)
      lastChild = document.createComment(`[#]`)
      fragment.append(lastChild)
    }

    if (lastPrevious) lastPrevious.after(fragment)
    else placeholder.after(fragment)
  })

  return parent
}
