/* eslint-disable complexity */

import register from "../register.js"
import render from "../render.js"
import setControlData from "../../fabric/dom/setControlData.js"
import getControlData from "../../fabric/dom/getControlData.js"
import setAttributes from "../../fabric/dom/setAttributes.js"
import create from "../create.js"
import findScope from "../findScope.js"
import resolveScope from "../resolveScope.js"
import getBasename from "../../core/path/core/getBasename.js"
import debounce from "../../fabric/type/function/debounce.js"
import { toTitleCase } from "../../fabric/type/string/letters.js"
import hash from "../../fabric/type/any/hash.js"

const TEXTBOX_TYPES = new Set(["text", "email", "search"])

function setValidation(def, { localName, type }) {
  const attr = {}
  if (def.required) attr.required = true
  if (def.schema) {
    const { schema } = def
    // string
    if ("pattern" in schema) attr.pattern = schema.pattern
    if ("minLength" in schema) attr.minLength = schema.minLength
    if ("maxLength" in schema) attr.maxLength = schema.maxLength

    // number
    if ("multipleOf" in schema) attr.step = schema.multipleOf
    if ("exclusiveMinimum" in schema) attr.min = schema.exclusiveMinimum + 1
    else if ("minimum" in schema) attr.min = schema.minimum
    if ("exclusiveMaximum" in schema) attr.max = schema.exclusiveMaximum - 1
    else if ("maximum" in schema) attr.max = schema.maximum
  }

  if (
    localName === "textarea" ||
    (localName === "input" && TEXTBOX_TYPES.has(type))
  ) {
    attr.autocomplete = def.autocomplete ?? "off" // opt-in autocomplete
    if (def.prose !== true) {
      attr.autocapitalize = "none"
      attr.autocorrect = "off"
      attr.spellcheck = "false"
      attr.translate = "no"
    }
  }

  return attr
}

function getBindScope(ctx, bind) {
  return resolveScope(...findScope(ctx, bind), ctx)
}

function normalizeOptions(list) {
  return list.map((item) => {
    if (typeof item === "string") {
      return { tag: "option", content: item, label: item }
    }

    if (Array.isArray(item)) {
      return {
        tag: "option",
        content: item[1],
        label: item[1],
        value: item[0],
      }
    }

    item.label ??= item.content

    if (Array.isArray(item.content)) {
      item.tag ??= "optgroup"
      item.content = normalizeOptions(item.content)
    }

    return item
  })
}

export default function renderControl(el, ctx, def) {
  el.id ||= hash(ctx.steps)

  if (el.localName === "select") {
    if (Array.isArray(def.content)) {
      def.content = normalizeOptions(def.content)
    }

    el.append(render(def.content, ctx))
    delete def.content
  }

  if (def.bind) {
    let scopeFrom
    let scopeTo
    if (def.bind.from) {
      scopeFrom = getBindScope(ctx, def.bind.from)
      register(ctx, scopeFrom, async (val) => setControlData(el, await val))
    }

    if (def.bind.to) {
      scopeTo =
        def.bind.to === def.bind.from
          ? scopeFrom
          : getBindScope(ctx, def.bind.to)

      const fn = () => ctx.reactive.set(scopeTo, getControlData(el))

      def.on ??= []
      def.on.push(
        def.lazy
          ? {
              [def.enterKeyHint === "enter"
                ? "change || Control+s"
                : "change || Control+s || Enter"]: fn,
            }
          : def.debounce
          ? {
              input: debounce(fn, def.debounce),
              [def.enterKeyHint === "enter"
                ? "change || Control+s"
                : "change || Control+s || Enter"]: fn,
            }
          : { input: fn }
      )
    }

    if (el.type === "radio") {
      el.value = def.value
      el.checked = def.checked
    } else {
      const name = scopeTo ?? scopeFrom
      if (name) el.name ||= name
    }
  }

  setAttributes(el, setValidation(def, el))

  const labelText =
    def.label ??
    (el.type === "radio"
      ? toTitleCase(el.value)
      : toTitleCase(getBasename(el.name)))

  const role = el.getAttribute("role")

  if (role === "menuitemcheckbox" || role === "menuitemradio") {
    const label = render(
      { tag: "label", for: el.id, role: "none", content: labelText },
      ctx
    )
    label.prepend(el)
    return label
  }

  const field =
    el.type === "radio" || el.type === "checkbox"
      ? create(".check-cont")
      : document.createDocumentFragment()

  if (labelText) {
    el.removeAttribute("label")

    const label = render({ tag: "label", for: el.id, content: labelText }, ctx)

    if (def.compact === true) label.classList.add("sr-only")

    if (def.required) {
      label.append(
        create("abbr", { "aria-hidden": "true", "title": "Required" }, "*")
      )
    }

    field.append(label)
  }

  field.append(el)

  return field
}
