// @related https://github.com/userpixel/micromustache
// @read https://web.dev/sanitizer/
// @read https://web.dev/trusted-types/

import locate from "../../fabric/locator/locate.js"
import parseTemplate from "./template/parseTemplate.js"
import compileTemplate from "./template/compileTemplate.js"
import makeTemplate from "./template/makeTemplate.js"
import JSON5 from "./json5.js"

const jsonParse = JSON5.parse

export default function template(source, { filters, locals } = {}) {
  return compileTemplate(
    parseTemplate(source, jsonParse), //
    { locate, filters, jsonParse, locals }
  )
}

template.make = makeTemplate

template.parse = (source) => parseTemplate(source, jsonParse)

template.compile = (parsed, options = {}) =>
  compileTemplate(
    parsed, //
    { locate, jsonParse, ...options }
  )

template.format = (parsed, locals, filters) =>
  compileTemplate(
    parsed, //
    { locate, jsonParse, filters, locals }
  )(locals)

template.formatAsync = async (parsed, locals, filters) =>
  compileTemplate(
    parsed, //
    { locate, jsonParse, filters, locals, async: true }
  )(locals)

template.render = (source, locals, filters) =>
  compileTemplate(
    parseTemplate(source, jsonParse), //
    { locate, jsonParse, filters, locals }
  )(locals)

template.renderAsync = async (source, locals, filters) =>
  compileTemplate(
    parseTemplate(source, jsonParse), //
    { locate, jsonParse, filters, locals, async: true }
  )(locals)
