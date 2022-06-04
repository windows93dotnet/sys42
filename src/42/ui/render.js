import create from "./create.js"
import resolve from "./resolve.js"
import register from "./register.js"
import normalize from "./normalize.js"
import ELEMENTS_ALLOW_LIST from "../fabric/constants/ELEMENTS_ALLOW_LIST.js"
import SVG_TAGS from "../fabric/constants/SVG_TAGS.js"
import renderComponent from "./renderers/renderComponent.js"
import renderWhen from "./renderers/renderWhen.js"
import renderRepeat from "./renderers/renderRepeat.js"

const SPECIAL_STRINGS = {
  "\n\n": () => document.createElement("br"),
  "---": () => document.createElement("hr"),
}

export default function render(...args) {
  const { type, def, ctx } = normalize(...args)
  if (type === "string") return SPECIAL_STRINGS[def]?.() ?? def

  if (type === "function") {
    const el = document.createTextNode("")
    register(ctx, def, (val) => {
      el.textContent = val
    })
    return el
  }

  if (type === "array") {
    const fragment = document.createDocumentFragment()
    for (const content of def) fragment.append(render(content, ctx))
    return fragment
  }

  if (def.when) return renderWhen(def, ctx)
  if (def.repeat) return renderRepeat(def, ctx)

  let el

  if (def.tag || def.attrs) {
    el = create(ctx, def.tag, def.attrs)
    ctx.el = el
    const { localName } = el

    if (el.form !== undefined && el.name) {
      el.name = resolve(ctx.scope, el.name)
      register(ctx, el.name, (val) => {
        el.value = val
      })
    }

    const isComponent = localName.startsWith("ui-")

    if (
      !isComponent &&
      ctx.trusted !== true &&
      !ELEMENTS_ALLOW_LIST.includes(localName) &&
      !SVG_TAGS.includes(localName)
    ) {
      return document.createComment(`[disallowed tag: ${localName}]`)
    }

    if (isComponent) return renderComponent(el, def, ctx)
  } else {
    el = document.createDocumentFragment()
  }

  if (def.content) el.append(render(def.content, ctx))

  return el
}
