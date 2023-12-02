import render from "../render.js"
import create from "../create.js"
import { addEntry } from "../normalize.js"
import preload from "../../core/load/preload.js"
import renderControl from "./renderControl.js"
import renderOptions from "./renderOptions.js"
import renderTooltip from "./renderTooltip.js"
import ALLOWED_HTML_TAGS from "../../fabric/constants/ALLOWED_HTML_TAGS.js"
import ALLOWED_SVG_TAGS from "../../fabric/constants/ALLOWED_SVG_TAGS.js"
import SecurityError from "../../fabric/errors/SecurityError.js"

export const PRELOAD = new Set(["link", "script"])
export const NOT_CONTROLS = new Set(["label", "legend", "output", "option"])
export const HAS_OPTIONS = new Set([
  "select",
  "selectmenu",
  "optgroup",
  "datalist",
])

export function renderTag(tag, plan, stage) {
  let el = create(stage, tag, plan.attrs)

  const { localName } = el
  if (localName) stage.el = el

  if (
    localName &&
    stage.trusted !== true &&
    !ALLOWED_HTML_TAGS.includes(localName) &&
    !ALLOWED_SVG_TAGS.includes(localName)
  ) {
    throw new SecurityError(`Disallowed tag: ${localName}`)
  }

  if (plan.entry) addEntry(stage.component, plan.entry, el)
  if (plan.tooltip) renderTooltip(el, plan.tooltip, stage)

  if (HAS_OPTIONS.has(localName)) renderOptions(el, plan, stage)

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

  if (PRELOAD.has(localName)) stage.waitlistPreload.push(preload(el))

  return el
}

export default renderTag
