import create from "./create.js"
import register from "./register.js"
import normalize from "./normalize.js"
import ALLOWED_HTML_TAGS from "../fabric/constants/ALLOWED_HTML_TAGS.js"
import ALLOWED_SVG_TAGS from "../fabric/constants/ALLOWED_SVG_TAGS.js"
import preload from "../core/load/preload.js"
import renderComponent from "./renderers/renderComponent.js"
import renderControl from "./renderers/renderControl.js"
import renderIf from "./renderers/renderIf.js"
import renderEach from "./renderers/renderEach.js"
import renderOn from "./renderers/renderOn.js"
import renderAnimation from "./renderers/renderAnimation.js"

const { ELEMENT_NODE } = Node

const SPECIAL_STRINGS = {
  "\n\n": () => document.createElement("br"),
  "---": () => document.createElement("hr"),
}

const PRELOAD = new Set(["link", "script"])

function renderTag(ctx, def) {
  let el = create(ctx, def.tag, def.attrs)

  const { localName } = el
  if (localName) {
    ctx.el = el
  }

  if (def.picto) {
    if (el.localName === "button") {
      el.classList.add("btn-picto")
    }

    el.append(renderComponent(create("ui-picto"), { value: def.picto }, ctx))
  }

  if (el.form !== undefined) {
    el = renderControl(el, ctx, def)
  }

  if (
    localName &&
    ctx.trusted !== true &&
    !ALLOWED_HTML_TAGS.includes(localName) &&
    !ALLOWED_SVG_TAGS.includes(localName)
  ) {
    throw new DOMException(`Disallowed tag: ${localName}`, "SecurityError")
  }

  if (PRELOAD.has(localName)) {
    ctx.preload.push(preload(el.src ?? el.href))
  }

  return el
}

export default function render(def, ctx, options) {
  for (const handle of ctx.pluginHandlers) handle(def, ctx, options)

  if (def?.tag?.startsWith("ui-")) {
    delete def.attrs
    if (options?.step !== undefined) {
      ctx = { ...ctx }
      ctx.steps += "," + options.step
    }

    return renderComponent(create(def.tag), def, ctx)
  }

  if (!options?.skipNormalize) {
    const normalized = normalize(def, ctx, options)
    def = normalized[0]
    ctx = normalized[1]
  }

  if (options?.step !== undefined) ctx.steps += "," + options.step

  switch (ctx.type) {
    case "string":
      return SPECIAL_STRINGS[def]?.() ?? document.createTextNode(def)

    case "array": {
      const fragment = document.createDocumentFragment()
      for (let step = 0, l = def.length; step < l; step++) {
        fragment.append(render(def[step], ctx, { step }))
      }

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

  const el =
    def.tag || def.attrs
      ? renderTag(ctx, def)
      : document.createDocumentFragment()

  if (def.content) {
    el.append(
      render(def.content, ctx, {
        step:
          el.nodeType === ELEMENT_NODE
            ? el.localName + (el.id ? `#${el.id}` : "")
            : undefined,
      })
    )
  }

  def.traits?.(ctx.el)

  if (def.on) renderOn(ctx.el, def.on, ctx)

  if (def.animate?.from) renderAnimation(ctx, ctx.el, "from", def.animate.from)

  return el
}
