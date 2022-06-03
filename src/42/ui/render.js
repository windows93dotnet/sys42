import create from "./create.js"
import register from "./register.js"
import normalize from "./normalize.js"
import ELEMENTS_ALLOW_LIST from "../fabric/constants/ELEMENTS_ALLOW_LIST.js"
import SVG_TAGS from "../fabric/constants/SVG_TAGS.js"
import renderAttributes from "./renderers/renderAttributes.js"
import renderComponent from "./renderers/renderComponent.js"
import renderRepeat from "./renderers/renderRepeat.js"

const SPECIAL_STRINGS = {
  "\n\n": () => document.createElement("br"),
  "---": () => document.createElement("hr"),
}

export default function render(...args) {
  const { type, def, ctx } = normalize(...args)
  return renderNormalized(type, def, ctx)
}

export function renderNormalized(type, def, ctx) {
  if (type === "string") return SPECIAL_STRINGS[def]?.() ?? def

  if (type === "function") {
    const textNode = document.createTextNode("")
    register(ctx, def, (val) => {
      textNode.textContent = val
    })
    return textNode
  }

  if (type === "array") {
    const fragment = document.createDocumentFragment()
    for (const content of def) fragment.append(render(content, ctx))
    return fragment
  }

  if (def.repeat) return renderRepeat(def, ctx)

  let el

  if (def.tag || def.attrs) {
    el = create(ctx, def.tag)
    ctx.el = el
    const { localName } = el

    const isComponent = localName.startsWith("ui-")

    if (
      !isComponent &&
      ctx.trusted !== true &&
      !ELEMENTS_ALLOW_LIST.includes(localName) &&
      !SVG_TAGS.includes(localName)
    ) {
      return document.createComment(`[disallowed tag: ${localName}]`)
    }

    if (def.attrs) renderAttributes(el, ctx, def.attrs)
    if (isComponent) return renderComponent(el, def, ctx)
  } else {
    el = document.createDocumentFragment()
  }

  if (def.content) el.append(render(def.content, ctx))

  return el
}
