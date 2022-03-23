// @related https://github.com/userpixel/micromustache
// @read https://web.dev/sanitizer/
// @read https://web.dev/trusted-types/

import locate from "../../fabric/locator/locate.js"
import parseTemplate from "./template2/parseTemplate.js"
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

template.format = (parsed, locals, filters) =>
  compileTemplate(
    parsed, //
    { locate, filters, jsonParse, locals }
  )(locals)

template.format.async = async (parsed, locals, filters) =>
  compileTemplate(
    parsed, //
    { locate, filters, jsonParse, locals, async: true }
  )(locals)

template.render = (source, locals, filters) =>
  compileTemplate(
    parseTemplate(source, jsonParse), //
    { locate, filters, jsonParse, locals }
  )(locals)

template.render.async = (source, locals, filters) =>
  compileTemplate(
    parseTemplate(source, jsonParse), //
    { locate, filters, jsonParse, locals, async: true }
  )(locals)
