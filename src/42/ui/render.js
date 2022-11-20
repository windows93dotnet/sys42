/* eslint-disable complexity */
import create from "./create.js"
import register from "./register.js"
import normalize, { addEntry } from "./normalize.js"
import ALLOWED_HTML_TAGS from "../fabric/constants/ALLOWED_HTML_TAGS.js"
import ALLOWED_SVG_TAGS from "../fabric/constants/ALLOWED_SVG_TAGS.js"
import preload from "../core/load/preload.js"
import renderComponent from "./renderers/renderComponent.js"
import renderControl from "./renderers/renderControl.js"
import renderIf from "./renderers/renderIf.js"
import renderEach from "./renderers/renderEach.js"
import renderOn from "./renderers/renderOn.js"
import renderAnimation from "./renderers/renderAnimation.js"
import renderOptions from "./renderers/renderOptions.js"

const { ELEMENT_NODE } = Node

const makeBr = () => document.createElement("br")
const makeHr = () => document.createElement("hr")
const SPECIAL_STRINGS = {
  "\n\n": makeBr,
  "<br>": makeBr,
  "---": makeHr,
  "<hr>": makeHr,
}

const PRELOAD = new Set(["link", "script"])
const NOT_CONTROLS = new Set(["label", "legend", "output", "option"])
const HAS_OPTIONS = new Set(["select", "selectmenu", "optgroup", "datalist"])

function renderTag(tag, def, ctx) {
  let el = create(ctx, tag, def.attrs)

  const { localName } = el
  if (localName) ctx.el = el

  if (
    localName &&
    ctx.trusted !== true &&
    !ALLOWED_HTML_TAGS.includes(localName) &&
    !ALLOWED_SVG_TAGS.includes(localName)
  ) {
    throw new DOMException(`Disallowed tag: ${localName}`, "SecurityError")
  }

  if (def.entry) {
    addEntry(ctx.component, def.entry, el)
    delete def.entry
  }

  if (HAS_OPTIONS.has(localName)) renderOptions(el, ctx, def)

  if (localName === "button") {
    def.content ??= def.label
  } else if (localName === "fieldset") {
    if (def.label) el.append(render({ tag: "legend", content: def.label }, ctx))
  } else if (el.form !== undefined && !NOT_CONTROLS.has(localName)) {
    el = renderControl(el, ctx, def)
  }

  if (def.picto) {
    el.classList.add("has-picto")
    if (!def.content) el.classList.add("has-picto--only-child")
    if (def.picto.start) el.classList.add("has-picto--start")
    if (def.picto.end) el.classList.add("has-picto--end")
  }

  if (PRELOAD.has(localName)) {
    ctx.preload.push(preload(el.src ?? el.href))
  }

  return el
}

export default function render(def, ctx, options) {
  if (ctx?.pluginHandlers) {
    for (const handle of ctx.pluginHandlers) handle(def, ctx, options)
  }

  if (def?.tag?.startsWith("ui-")) {
    delete def.attrs
    if (options?.step !== undefined) {
      ctx = { ...ctx }
      ctx.steps += "," + options.step
    }

    return renderComponent(create(def.tag), def, ctx, options)
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

  let el
  let container

  if (def.tag || def.attrs) {
    if (def.tag) {
      const nesteds = def.tag.split(/\s*>\s*/)
      for (let i = 0, l = nesteds.length; i < l; i++) {
        const tag = nesteds[i]
        const cur = i === l - 1 ? renderTag(tag, def, ctx) : create(tag)
        if (el) el.append(cur)
        else container = cur
        el = cur
      }
    } else {
      el = renderTag(def.tag, def, ctx)
    }
  } else {
    el = document.createDocumentFragment()
  }

  if (def.picto?.start) {
    el.append(
      renderComponent(create("ui-picto"), { value: def.picto.start }, ctx)
    )
  }

  if (def.content) {
    if (def.content instanceof Node) el.append(def.content)
    else {
      el.append(
        render(def.content, ctx, {
          step:
            el.nodeType === ELEMENT_NODE
              ? el.localName + (el.id ? `#${el.id}` : "")
              : undefined,
        })
      )
    }
  }

  if (def.picto?.end) {
    el.append(
      renderComponent(create("ui-picto"), { value: def.picto.end }, ctx)
    )
  }

  def.traits?.(ctx.el)

  if (def.on) renderOn(ctx.el, def, ctx)

  if (def.animate?.from) renderAnimation(ctx, ctx.el, "from", def.animate.from)

  return container ?? el
}
