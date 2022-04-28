/* eslint-disable complexity */

import setAttributes from "../fabric/dom/setAttributes.js"
import isEmptyObject from "../fabric/type/any/is/isEmptyObject.js"
import uid from "../fabric/uid.js"
import parseDotNotation from "../fabric/locator/parseDotNotation.js"
import ELEMENTS_ALLOW_LIST from "../fabric/constants/ELEMENTS_ALLOW_LIST.js"
import shortcuts from "../system/shortcuts.js"

import arrify from "../fabric/type/any/arrify.js"
import {
  toKebabCase,
  toCamelCase,
  toTitleCase,
} from "../fabric/type/string/letters.js"

import renderControl from "./renderers/renderControl.js"
import renderRepeat from "./renderers/renderRepeat.js"
import renderText from "./renderers/renderText.js"
import renderTraits from "./renderers/renderTraits.js"
import renderWhen from "./renderers/renderWhen.js"
import renderComponent from "./renderers/renderComponent.js"

import normalizeDefinition from "./utils/normalizeDefinition.js"
import parseAbbreviation from "./utils/parseAbbreviation.js"
import makeNewContext from "./utils/makeNewContext.js"
import populateContext from "./utils/populateContext.js"
import popupButton from "./utils/popupButton.js"
import setAction from "./utils/setAction.js"
import joinScope from "./utils/joinScope.js"
import create from "./create.js"

const { ELEMENT_NODE } = Node

const frag = () => document.createDocumentFragment()

const BUTTON_TYPES = new Set([
  "button", //
  "reset",
  "submit",
])

const INPUT_TYPES = new Set([
  "color",
  "date",
  "datetime-local",
  "email",
  "file",
  "month",
  "number",
  "password",
  "range",
  "search",
  "tel",
  "text",
  "time",
  "url",
  "week",
])

// @read https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#sectioning_content
const SECTIONING = new Set([
  "article", //
  "aside",
  "nav",
  "section",
])

// @read https://www.w3.org/TR/wai-aria-practices/examples/landmarks/HTML5.html
const LANDMARKS = new Set([
  ...SECTIONING, //
  "form",
  "main",
  "header",
  "footer",
])

function heading(def, ctx, attributes, el) {
  const label = render(def.label, ctx)

  const id = attributes.id ?? toKebabCase(label.textContent)

  ctx.level ??= 2

  if (LANDMARKS.has(def.type)) {
    el.setAttribute("aria-labelledby", id)
    ctx.level++
    if (ctx.level > 6) ctx.level = 6
  } else if (ctx.level === 1 && ctx.global.h1Done) {
    ctx.level = 2
  }

  const picto = render({ type: "ui-picto", value: "link" }, ctx)
  const link = create(ctx, "a", { href: `#${id}` }, picto, label)

  if (ctx.level === 1) ctx.global.h1Done = true

  return create(`h${ctx.level}`, { id }, link)
}

function getNameAndLabel(def, ctx, required) {
  let label

  if (typeof def.label === "string") {
    label = def.label ? render(def.label, ctx, undefined, "span") : undefined
  } else if (def.name) {
    const nameAsLabel = toTitleCase(parseDotNotation(def.name).at(-1))
    if (nameAsLabel !== ".") label = render(nameAsLabel, ctx)
  }

  let name = def.name
    ? def.name
    : label
    ? toCamelCase(label.textContent)
    : undefined

  if (name && "scope" in ctx) name = joinScope(ctx.scope, name)

  if (label && required) {
    label.append(
      create("abbr", { "aria-hidden": "true", "title": "Required" }, "*")
    )
  }

  return { name, label }
}

function getControlMeta(def, ctx, control, attributes) {
  const id = attributes.id ?? uid()
  const { name, label } = getNameAndLabel(def, ctx, control.required)

  def.registerControl = attributes.value ?? control.schema?.default

  return { id, name, label }
}

function setValidation(attr, control, def) {
  if (control.required) attr.required = true
  if (control.schema) {
    const { schema } = control
    // string
    if ("pattern" in schema) attr.pattern = schema.pattern
    if ("minLength" in schema) attr.minLength = schema.minLength
    if ("maxLength" in schema) attr.maxLength = schema.maxLength

    // number
    if ("multipleOf" in schema) attr.step = schema.multipleOf
    if ("minimum" in schema) attr.min = schema.minimum
    if ("maximum" in schema) attr.max = schema.maximum
    if ("exclusiveMinimum" in schema) attr.min = schema.exclusiveMinimum + 1
    if ("exclusiveMaximum" in schema) attr.max = schema.exclusiveMaximum - 1
  }

  attr.autocomplete = "off"

  if (def.prose === false) {
    attr.autocapitalize = "none"
    attr.autocorrect = "off"
    attr.spellcheck = "false"
    attr.translate = "no"
  }

  return attr
}

function append(parent, def, ctx, el) {
  if (def.run && def.type !== "button") setAction(el, def, ctx)

  let shortcutsConfig

  if ("shortcuts" in def) {
    shortcutsConfig = {
      agent: ctx.global.actions.get(ctx.scope),
      signal: ctx.cancel.signal,
      preventDefault: true,
      serializeArgs: true,
    }
  }

  if (el.nodeType === ELEMENT_NODE) {
    renderTraits(el, def, ctx)
    if (shortcutsConfig) {
      shortcuts(el, def.shortcuts, shortcutsConfig)
    }
  } else if (shortcutsConfig) {
    shortcuts(
      parent.nodeType === ELEMENT_NODE ? parent : globalThis,
      def.shortcuts,
      shortcutsConfig
    )
  }

  parent.append(el)

  if ("registerControl" in def) renderControl(el, def, ctx)

  return parent
}

function insert(parent, el) {
  parent.append(el)
  return parent
}

export default function render(def, ctx = {}, parent = frag(), textMaker) {
  ctx = makeNewContext(ctx)

  /* text
  ------- */

  if (def == null || def === false) return parent

  if (typeof def !== "object") {
    if (def === "---") return insert(parent, create("hr"))
    if (def === "\n") return insert(parent, create("br"))
    renderText(def, ctx, parent, textMaker)
    return parent
  }

  /* array
  -------- */

  if (Array.isArray(def)) {
    for (const item of def) render(item, ctx, parent, textMaker)
    return parent
  }

  /* element
  ---------- */

  if (def instanceof Element) return insert(parent, def)

  /* data/schema
  -------------- */

  populateContext(ctx, def)

  if ("when" in def) {
    return renderWhen(def, ctx, parent, textMaker)
  }

  /* component
  ------------ */

  if (def.type?.startsWith("ui-")) {
    def = { ...def }

    // force "app" permissions for <ui-enclose>
    if (ctx.trusted !== true && "permissions" in def) def.permissions = "app"

    return insert(parent, renderComponent(def.type, def, ctx))
  }

  if ("repeat" in def) {
    return renderRepeat(def, ctx, parent, textMaker)
  }

  /* normalize
  ------------ */

  const normalized = normalizeDefinition({}, def)
  def = normalized.def

  const attributes = normalized.attrs
  if (def.type) {
    const parsed = parseAbbreviation(def.type, attributes)
    def.type = parsed.tag
  }

  /* button
  --------- */

  if ((def.run || def.popup || def.dialog) && !def.type) def.type = "button"

  if (BUTTON_TYPES.has(def.type)) {
    const { value, type } = def

    let { label, content } = def
    label ??= content

    let tooltip

    if (!label) {
      if (def.run) {
        const title = toTitleCase(
          typeof def.run === "string" ? def.run : def.run.name
        )
        if (def.picto) tooltip = title
        else label = title
      } else if (typeof def.dialog?.label === "string") {
        label = def.dialog.label
      }
    }

    if (typeof label === "string") label = { type: "span", content: label }

    if (def.picto) {
      label = [{ type: "ui-picto", value: def.picto, tooltip }, label]
    }

    let el = create(
      ctx,
      "button",
      { type, value },
      attributes,
      render(label, ctx)
    )

    if (def.picto) el.classList.add("btn-picto")

    if (def.run) {
      setAction(el, def, ctx)
      if (def.popup) {
        const splitBtn = popupButton(create("button"), def.popup, ctx)
        el = create(ctx, "div", { class: "ctrl-group box-v" }, el, splitBtn)
      }
    } else if (def.popup) {
      popupButton(el, def.popup, ctx)
    } else if (def.dialog) {
      popupButton(el, { type: "ui-dialog", content: def.dialog }, ctx)
    } else {
      console.warn(`button should have a "run", "dialog" or "popup" keyword`)
    }

    return append(parent, def, ctx, el)
  }

  /* input/select
  --------------- */
  const { control } = ctx

  if (
    def.type === "input" ||
    def.type === "select" ||
    def.type === "textarea" ||
    INPUT_TYPES.has(def.type)
  ) {
    let { id, name, label } = getControlMeta(def, ctx, control, attributes)

    if (label) {
      label = create(ctx, "label", { for: id }, label)
      if (def.compact === true) label.classList.add("sr-only")
      parent.append(label)
    }

    if (def.type === "select") {
      const validation = setValidation({ id, name }, control, def)
      const el = create(ctx, "select", validation, attributes)
      const options = []
      for (let option of def.content ?? control.schema?.enum ?? options) {
        const type = typeof option
        if (type === "string") option = { type: "option", content: option }
        options.push(option)
      }

      render(options, ctx, el)
      append(parent, def, ctx, el)
    } else if (def.type === "textarea") {
      const rows = def.rows ?? 4
      const validation = setValidation({ id, name, rows }, control, def)
      append(parent, def, ctx, create(ctx, "textarea", validation, attributes))
    } else {
      const type = def.type === "input" ? false : def.type
      const validation = setValidation({ id, type, name }, control, def)
      append(parent, def, ctx, create(ctx, "input", validation, attributes))
    }

    return parent
  }

  if (def.type === "option") {
    let { selected, label, value } = def
    value ??= def.content
    label ??= value
    const el = create(ctx, "option", { selected, label, value }, label)
    return append(parent, def, ctx, el)
  }

  /* checkbox
  ----------- */

  if (def.type === "checkbox") {
    const { id, name, label } = getControlMeta(def, ctx, control, attributes)

    const type = "checkbox"

    let el

    const checkbox = create(ctx, "input", attributes, { id, type, name })

    if (attributes.role === "menuitemcheckbox") {
      el = create(ctx, "label", { role: "none" })
      append(el, def, ctx, checkbox)
      el.append(label)
    } else {
      el = create(ctx, "div", { class: "check-cont" })
      append(el, def, ctx, checkbox)
      if (label) el.append(create(ctx, "label", { for: id }, label))
    }

    parent.append(el)
    return parent
  }

  /* fieldset
  ----------- */

  if (
    def.type === "fieldset" ||
    (ctx.trusted === true && def.type === "form")
  ) {
    const { label } = getNameAndLabel(def, ctx)

    const el = create(ctx, def.type, attributes)

    if (def.type === "fieldset") {
      let legend
      if (label) {
        legend = create(ctx, "legend", label)
        el.append(legend)
      }
    } else {
      if (label) parent.append(heading(def, ctx, attributes, el))
      el.onsubmit = (e) => e.preventDefault()
    }

    for (const item of arrify(def.content)) {
      let makeText
      if (typeof item === "string") {
        makeText = "p"
      } else if (item.content) {
        item.type ??= "fieldset"
      }

      el.append(render(item, ctx, create("div"), makeText))
    }

    return append(parent, def, ctx, el)
  }

  /* generic
  ---------- */

  if (
    def.type &&
    ctx.trusted !== true &&
    !ELEMENTS_ALLOW_LIST.includes(def.type)
  ) {
    return parent
  }

  const isBody = def.type === "body"

  const el =
    isBody || (!def.type && isEmptyObject(attributes))
      ? frag()
      : create(ctx, def.type ?? "div", attributes)

  if (isBody) {
    ctx.level ??= 1
    setAttributes(document.body, attributes)
  }

  const useParagraph = isBody || SECTIONING.has(def.type)

  if (def.label) el.append(heading(def, ctx, attributes, el))

  for (const item of arrify(def.content)) {
    render(item, ctx, el, useParagraph ? "p" : textMaker)
  }

  return append(parent, def, ctx, el)
}
