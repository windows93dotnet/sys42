import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import createRange from "../../fabric/dom/createRange.js"
import registerRenderer from "../utils/registerRenderer.js"
import makeNewContext from "../utils/makeNewContext.js"

const PLACEHOLDER_COMMENT = "[repeat]"
const ITEM_COMMENT = "[#]"

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
  const placeholder = document.createComment(PLACEHOLDER_COMMENT)
  container.append(placeholder)

  registerRenderer(ctx, ctx.scope, () => {
    const array = ctx.global.state.getProxy(ctx.scope)

    // console.log(444, ctx.scope, [...array])

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

      let inRange = false
      let node

      while ((node = walker.nextNode())) {
        if (node === placeholder) {
          inRange = true
          continue
        }

        if (inRange && node.textContent === ITEM_COMMENT) {
          lastPrevious = node

          if (lastPrevious === lastChild) {
            ++i
            break
          }

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
      }
    }

    const fragment = document.createDocumentFragment()

    for (; i < length; i++) {
      const newCtx = makeNewContext(ctx)
      newCtx.scope = `${newCtx.scope}.${i}`
      render(repeat, newCtx, fragment, textMaker)
      lastChild = document.createComment(ITEM_COMMENT)
      fragment.append(lastChild)
    }

    if (lastPrevious) lastPrevious.after(fragment)
    else placeholder.after(fragment)
  })

  return parent
}
