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

function renderTag(tag, plan, ctx) {
  let el = create(ctx, tag, plan.attrs)

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

  if (plan.entry) {
    addEntry(ctx.component, plan.entry, el)
    delete plan.entry
  }

  if (HAS_OPTIONS.has(localName)) renderOptions(el, ctx, plan)

  if (localName === "button") {
    plan.content ??= plan.label
  } else if (localName === "fieldset") {
    if (plan.label)
      el.append(render({ tag: "legend", content: plan.label }, ctx))
  } else if (el.form !== undefined && !NOT_CONTROLS.has(localName)) {
    el = renderControl(el, ctx, plan)
  }

  if (plan.picto) {
    el.classList.add("has-picto")
    if (!plan.content) el.classList.add("has-picto--only-child")
    if (plan.picto.start) el.classList.add("has-picto--start")
    if (plan.picto.end) el.classList.add("has-picto--end")
  }

  if (PRELOAD.has(localName)) {
    ctx.preload.push(preload(el.src ?? el.href))
  }

  return el
}

export default function render(plan, ctx, options) {
  if (ctx?.pluginHandlers) {
    for (const pluginHandle of ctx.pluginHandlers) {
      const res = pluginHandle(plan, ctx, options)
      if (res !== undefined) plan = res
    }
  }

  if (plan?.tag?.startsWith("ui-")) {
    // TODO: fix tags like "div > ui-foo"
    delete plan.attrs
    if (options?.step !== undefined) {
      ctx = { ...ctx }
      ctx.steps += "," + options.step
    }

    return renderComponent(create(plan.tag), plan, ctx, options)
  }

  if (!options?.skipNormalize) {
    const normalized = normalize(plan, ctx, options)
    plan = normalized[0]
    ctx = normalized[1]
  }

  if (options?.step !== undefined) ctx.steps += "," + options.step

  switch (ctx.type) {
    case "string":
      return SPECIAL_STRINGS[plan]?.() ?? document.createTextNode(plan)

    case "array": {
      const fragment = document.createDocumentFragment()
      for (let step = 0, l = plan.length; step < l; step++) {
        ctx.type = typeof plan[step]
        fragment.append(render(plan[step], ctx, { step }))
      }

      return fragment
    }

    case "function": {
      const el = document.createTextNode("")
      register(ctx, plan, (val) => {
        el.textContent = val
      })
      return el
    }

    default:
  }

  if (plan.if) return renderIf(plan, ctx)
  if (plan.each) return renderEach(plan, ctx)

  let el
  let container

  if (plan.tag || plan.attrs) {
    if (plan.tag) {
      const nesteds = plan.tag.split(/\s*>\s*/)
      for (let i = 0, l = nesteds.length; i < l; i++) {
        const tag = nesteds[i]
        const cur = i === l - 1 ? renderTag(tag, plan, ctx) : create(tag)
        if (el) el.append(cur)
        else container = cur
        el = cur
      }
    } else {
      el = renderTag(plan.tag, plan, ctx)
    }
  } else {
    el = document.createDocumentFragment()
  }

  if (plan.picto?.start) {
    el.append(
      renderComponent(create("ui-picto"), { value: plan.picto.start }, ctx)
    )
  }

  if (plan.content) {
    if (plan.content instanceof Node) el.append(plan.content)
    else {
      el.append(
        render(plan.content, ctx, {
          step:
            el.nodeType === ELEMENT_NODE
              ? el.localName + (el.id ? `#${el.id}` : "")
              : undefined,
        })
      )
    }
  }

  if (plan.picto?.end) {
    el.append(
      renderComponent(create("ui-picto"), { value: plan.picto.end }, ctx)
    )
  }

  if (plan.traits) ctx.traitsReady.push(plan.traits(ctx.el))

  if (plan.on) renderOn(ctx.el, plan, ctx)

  if (plan.animate?.from)
    renderAnimation(ctx, ctx.el, "from", plan.animate.from)

  return container ?? el
}
