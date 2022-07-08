/* eslint-disable complexity */
import create from "./create.js"
import resolveScope from "./resolveScope.js"
import register from "./register.js"
import normalize from "./normalize.js"
import ELEMENTS_ALLOW_LIST from "../fabric/constants/ELEMENTS_ALLOW_LIST.js"
import SVG_TAGS from "../fabric/constants/SVG_TAGS.js"
import renderComponent from "./renderers/renderComponent.js"
import renderIf from "./renderers/renderIf.js"
import renderEach from "./renderers/renderEach.js"
import renderListen from "./renderers/renderListen.js"

const SPECIAL_STRINGS = {
  "\n\n": () => document.createElement("br"),
  "---": () => document.createElement("hr"),
}

export default function render(...args) {
  const [def, ctx] = normalize(...args)

  if (ctx.type === "string") {
    return SPECIAL_STRINGS[def]?.() ?? document.createTextNode(def)
  }

  if (ctx.type === "function") {
    const el = document.createTextNode("")
    register(ctx, def, (val) => {
      el.textContent = val
    })
    return el
  }

  if (ctx.type === "array") {
    const fragment = document.createDocumentFragment()
    for (const content of def) fragment.append(render(content, ctx))
    return fragment
  }

  if (def.if) return renderIf(def, ctx)
  if (def.each) return renderEach(def, ctx)

  let el

  if (def.tag || def.attrs) {
    const isComponent = def.tag?.startsWith("ui-")

    el = create(ctx, def.tag, isComponent ? undefined : def.attrs)
    ctx.el = el
    const { localName } = el

    if (el.form !== undefined && el.name) {
      el.name = resolveScope(ctx, el.name)
      register(ctx, el.name, (val) => {
        el.value = val
      })
    }

    if (def.picto) {
      if (el.localName === "button") el.classList.add("btn-picto")
      el.append(render({ tag: "ui-picto", value: def.picto }))
    }

    if (
      !isComponent &&
      ctx.trusted !== true &&
      !ELEMENTS_ALLOW_LIST.includes(localName) &&
      !SVG_TAGS.includes(localName)
    ) {
      return document.createComment(`[disallowed tag: ${localName}]`)
    }

    if (isComponent) return renderComponent(el, def, ctx)

    if (def.on) renderListen(el, def.on, ctx)
  } else {
    el = document.createDocumentFragment()
  }

  if (def.content) el.append(render(def.content, ctx))

  return el
}
