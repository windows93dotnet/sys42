import render from "../render.js"
import omit from "../../fabric/type/object/omit.js"
import createRange from "../../fabric/dom/createRange.js"
import register from "../register.js"

const PLACEHOLDER = "[each]"
const ITEM = "[#]"

export default function renderEach(def, ctx) {
  const { each } = def

  def = omit(def, ["each"])

  const el = render(def, ctx)

  let lastChild
  const placeholder = document.createComment(PLACEHOLDER)
  el.append(placeholder)

  register(ctx, ctx.scope, (array) => {
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

        if (inRange && node.textContent === ITEM) {
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
      const newCtx = { ...ctx }
      newCtx.scope += `/${i}`
      fragment.append(render(each, newCtx))
      lastChild = document.createComment(ITEM)
      fragment.append(lastChild)
    }

    if (lastPrevious) lastPrevious.after(fragment)
    else placeholder.after(fragment)
  })

  return el
}
