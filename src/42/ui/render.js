/* eslint-disable complexity */
import create from "./create.js"
import resolveScope from "./resolveScope.js"
import register from "./register.js"
import normalize from "./normalize.js"
import ELEMENTS_ALLOW_LIST from "../fabric/constants/ELEMENTS_ALLOW_LIST.js"
import SVG_TAGS from "../fabric/constants/SVG_TAGS.js"
import preload from "../system/load/preload.js"
import renderComponent from "./renderers/renderComponent.js"
import renderIf from "./renderers/renderIf.js"
import renderEach from "./renderers/renderEach.js"
import renderListen from "./renderers/renderListen.js"
import renderAnimation from "./renderers/renderAnimation.js"

const SPECIAL_STRINGS = {
  "\n\n": () => document.createElement("br"),
  "---": () => document.createElement("hr"),
}

const PRELOAD = new Set(["link", "script"])

export default function render(def, ctx, options) {
  if (def?.tag?.startsWith("ui-")) {
    return renderComponent(create(def.tag), def, ctx)
  }

  if (!options?.skipNormalize) {
    const normalized = normalize(def, ctx)
    def = normalized[0]
    ctx = normalized[1]
  }

  switch (ctx.type) {
    case "string":
      return SPECIAL_STRINGS[def]?.() ?? document.createTextNode(def)

    case "array": {
      const fragment = document.createDocumentFragment()
      for (const content of def) fragment.append(render(content, ctx))
      return fragment
    }

    case "function": {
      const el = document.createTextNode("")
      register(ctx, def, (val) => {
        el.textContent = val
      })
      return el
    }

    default:
  }

  if (def.if) return renderIf(def, ctx)
  if (def.each) return renderEach(def, ctx)

  let el

  if (def.tag || def.attrs) {
    el = create(ctx, def.tag, def.attrs)

    const { localName } = el
    if (localName) ctx.el = el

    if (el.form !== undefined && el.name) {
      el.name = resolveScope(ctx, el.name)
      register(ctx, el.name, (val) => {
        el.value = val
      })
    }

    if (def.picto) {
      if (el.localName === "button") el.classList.add("btn-picto")
      el.append(renderComponent(create("ui-picto"), { value: def.picto }, ctx))
    }

    if (
      localName &&
      ctx.trusted !== true &&
      !ELEMENTS_ALLOW_LIST.includes(localName) &&
      !SVG_TAGS.includes(localName)
    ) {
      throw new DOMException(`Disallowed tag: ${localName}`, "SecurityError")
    }

    if (PRELOAD.has(localName)) {
      ctx.preload.push(preload(el.src ?? el.href))
    }

    if (def.on) renderListen(ctx.el, def.on, ctx)
  } else {
    el = document.createDocumentFragment()
  }

  if (def.content) el.append(render(def.content, ctx))

  if (def.from) renderAnimation(ctx, ctx.el, "from", def.from)
  else if (def.animate) renderAnimation(ctx, ctx.el, "from", def.animate)

  return el
}
