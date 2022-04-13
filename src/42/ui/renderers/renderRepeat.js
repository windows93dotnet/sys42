import render from "../render.js"
import createRange from "../../fabric/dom/createRange.js"
import registerRenderer from "../utils/registerRenderer.js"
import makeNewContext from "../utils/makeNewContext.js"

export default function renderRepeat(def, ctx, parent, textMaker) {
  const { repeat } = def
  delete def.repeat

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

  // registerRenderer(ctx, [ctx.scope, `${ctx.scope}.length`], () => {
  registerRenderer(ctx, ctx.scope, () => {
    const array = ctx.global.rack.get(ctx.scope)

    if (!Array.isArray(array)) {
      if (lastChild) {
        const range = createRange()
        range.setStartAfter(placeholder)
        range.setEndAfter(lastChild)
        range.deleteContents()
        lastChild = undefined
      }

      return
    }

    let previous
    let i = 0
    const l = array.length

    if (lastChild) {
      const range = createRange()
      range.setStartAfter(placeholder)
      range.setEndAfter(lastChild)
      if (!repeat.type && Array.isArray(repeat.content)) {
        // delete all if previous nodes was made of fragments
        range.deleteContents()
      } else {
        // only append necessary node
        previous = range.extractContents()
        i = previous.childNodes.length
        if (i > l) {
          range.setStartBefore(previous.childNodes[l])
          range.setEndAfter(previous.lastChild)
          range.deleteContents()
        }
      }

      lastChild = undefined
    }

    // const range = createRange()
    // range.setStartAfter(placeholder)
    // range.setEndAfter(lastChild || placeholder)
    // range.deleteContents()

    const fragment = document.createDocumentFragment()

    for (; i < l; i++) {
      const newCtx = makeNewContext(ctx)
      newCtx.scope = `${newCtx.scope}.${i}`
      render(repeat, newCtx, fragment, textMaker)
    }

    lastChild = fragment.lastChild || previous?.lastChild

    placeholder.after(fragment)
    if (previous) placeholder.after(previous)
  })

  return parent
}
