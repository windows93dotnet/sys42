/* eslint-disable complexity */
/* eslint-disable max-depth */
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
import idleDebounce from "../../fabric/type/function/idleDebounce.js"

import { toTitleCase } from "../../fabric/type/string/letters.js"
import hash from "../../fabric/type/any/hash.js"

function setValidation(def) {
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

  attr.autocomplete = def.autocomplete ?? "off" // opt-in autocomplete

  if (def.prose !== true) {
    attr.autocapitalize = "none"
    attr.autocorrect = "off"
    attr.spellcheck = "false"
    attr.translate = "no"
  }

  return attr
}

function getBindScope(ctx, bind) {
  // console.log(scope, resolveScope(ctx.scope, def.bind.from, ctx))
  return resolveScope(...findScope(ctx, bind), ctx)
}

export default function renderControl(el, ctx, def) {
  el.id ||= hash(ctx.steps)

  if (def.bind) {
    let scopeFrom
    if (def.bind.from) {
      scopeFrom = getBindScope(ctx, def.bind.from)
      el.name ||= scopeFrom

      register(ctx, scopeFrom, (val) => setControlData(el, val))
    }

    if (def.value) {
      // Save the value in the state if a value and a bind.from are set
      if (def.attrs.value.scopes) {
        // TODO: find way to wait for template function end
        const renderer = idleDebounce(async () => {
          ctx.reactive.set(scopeFrom, getControlData(el), { silent: true })
        })

        for (const scope of def.attrs.value.scopes) {
          if (scope === scopeFrom) continue
          register.registerRenderer(ctx, scope, renderer)
        }

        ctx.postrender.push(() => {
          ctx.reactive.set(scopeFrom, getControlData(el), { silent: true })
        })
      } else {
        ctx.reactive.set(scopeFrom, getControlData(el), { silent: true })
      }
    }

    if (def.bind.to) {
      const scopeTo =
        def.bind.to === def.bind.from
          ? scopeFrom
          : getBindScope(ctx, def.bind.to)

      el.name ||= scopeTo

      const fn = () => {
        ctx.reactive.set(scopeTo, getControlData(el))
      }

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
  }

  setAttributes(el, setValidation(def))

  const field =
    el.type === "radio" || el.type === "checkbox"
      ? create(".check-cont")
      : document.createDocumentFragment()

  const labelText =
    def.label ??
    (el.type === "radio"
      ? toTitleCase(el.value)
      : toTitleCase(getBasename(el.name)))

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
