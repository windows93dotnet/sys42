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

    if (!Array.isArray(array) || array.length === 0) {
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

    if (lastChild) {
      const walker = document.createTreeWalker(
        placeholder.parentElement,
        NodeFilter.SHOW_COMMENT
      )

      let lastPrevious
      const l = length - 1
      i = 0

      while (walker.nextNode()) {
        const { currentNode } = walker

        if (currentNode.textContent === "[#]") {
          lastPrevious = currentNode
          if (++i > l) {
            const range = createRange()
            range.setStartAfter(lastPrevious)
            range.setEndAfter(lastChild)
            range.deleteContents()
            break
          }
        }

        if (currentNode === lastChild) break
      }

      lastChild = undefined
    }

    const fragment =
      placeholder.parentElement ?? document.createDocumentFragment()

    for (; i < length; i++) {
      const newCtx = makeNewContext(ctx)
      newCtx.scope = `${newCtx.scope}.${i}`
      render(repeat, newCtx, fragment, textMaker)
      fragment.append(document.createComment(`[#]`))
    }

    lastChild = fragment.lastChild

    if (!placeholder.parentElement) placeholder.after(fragment)
  })

  return parent
}
