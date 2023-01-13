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

function renderTag(tag, plan, stage) {
  let el = create(stage, tag, plan.attrs)

  const { localName } = el
  if (localName) stage.el = el

  if (
    localName &&
    stage.trusted !== true &&
    !ALLOWED_HTML_TAGS.includes(localName) &&
    !ALLOWED_SVG_TAGS.includes(localName)
  ) {
    throw new DOMException(`Disallowed tag: ${localName}`, "SecurityError")
  }

  if (plan.entry) {
    addEntry(stage.component, plan.entry, el)
    delete plan.entry
  }

  if (HAS_OPTIONS.has(localName)) renderOptions(el, stage, plan)

  if (localName === "button") {
    plan.content ??= plan.label
  } else if (localName === "fieldset") {
    if (plan.label) {
      el.append(render({ tag: "legend", content: plan.label }, stage))
    }
  } else if (el.form !== undefined && !NOT_CONTROLS.has(localName)) {
    el = renderControl(el, stage, plan)
  }

  if (plan.picto) {
    el.classList.add("has-picto")
    if (!plan.content) el.classList.add("has-picto--only-child")
    if (plan.picto.start) el.classList.add("has-picto--start")
    if (plan.picto.end) el.classList.add("has-picto--end")
  }

  if (PRELOAD.has(localName)) {
    stage.preload.push(preload(el.src ?? el.href))
  }

  return el
}

export default function render(plan, stage, options) {
  if (stage?.pluginHandlers) {
    for (const pluginHandle of stage.pluginHandlers) {
      const res = pluginHandle(plan, stage, options)
      if (res !== undefined) plan = res
    }
  }

  if (plan?.tag?.startsWith("ui-")) {
    // TODO: fix tags like "div > ui-foo"
    delete plan.attrs
    if (options?.step !== undefined) {
      stage = { ...stage }
      stage.steps += "," + options.step
    }

    return renderComponent(create(plan.tag), plan, stage, options)
  }

  if (!options?.skipNormalize) {
    const normalized = normalize(plan, stage, options)
    plan = normalized[0]
    stage = normalized[1]
  }

  if (options?.step !== undefined) stage.steps += "," + options.step

  switch (stage.type) {
    case "string":
      return SPECIAL_STRINGS[plan]?.() ?? document.createTextNode(plan)

    case "array": {
      const fragment = document.createDocumentFragment()
      for (let step = 0, l = plan.length; step < l; step++) {
        stage.type = typeof plan[step]
        fragment.append(render(plan[step], stage, { step }))
      }

      return fragment
    }

    case "function": {
      const el = document.createTextNode("")
      register(stage, plan, (val) => {
        el.textContent = val
      })
      return el
    }

    default:
  }

  if (plan.if) return renderIf(plan, stage)
  if (plan.each) return renderEach(plan, stage)

  let el
  let container

  if (plan.tag || plan.attrs) {
    if (plan.tag) {
      const nesteds = plan.tag.split(/\s*>\s*/)
      for (let i = 0, l = nesteds.length; i < l; i++) {
        const tag = nesteds[i]
        const cur = i === l - 1 ? renderTag(tag, plan, stage) : create(tag)
        if (el) el.append(cur)
        else container = cur
        el = cur
      }
    } else {
      el = renderTag(plan.tag, plan, stage)
    }
  } else {
    el = document.createDocumentFragment()
  }

  if (plan.picto?.start) {
    el.append(
      renderComponent(create("ui-picto"), { value: plan.picto.start }, stage)
    )
  }

  if (plan.content) {
    if (plan.content instanceof Node) el.append(plan.content)
    else {
      el.append(
        render(plan.content, stage, {
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
      renderComponent(create("ui-picto"), { value: plan.picto.end }, stage)
    )
  }

  if (plan.traits) stage.traitsReady.push(plan.traits(stage.el))

  if (plan.on) renderOn(stage.el, plan, stage)

  if (plan.animate?.from) {
    renderAnimation(stage, stage.el, "from", plan.animate.from)
  }

  return container ?? el
}
