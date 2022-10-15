// @related https://github.com/userpixel/micromustache
// @read https://web.dev/sanitizer/
// @read https://web.dev/trusted-types/

import locate from "../../fabric/locator/locate.js"
import parseTemplate from "./template/parseTemplate.js"
import compileTemplate from "./template/compileTemplate.js"
import makeTemplate from "./template/makeTemplate.js"
import escapeTemplate from "./template/escapeTemplate.js"
import JSON5 from "./json5.js"

const jsonParse = JSON5.parse

export default function template(source, { actions, locals } = {}) {
  return compileTemplate(
    parseTemplate(source, jsonParse), //
    { locate, actions, jsonParse, locals }
  )
}

template.make = makeTemplate
template.escape = escapeTemplate

template.parse = (source) => parseTemplate(source, jsonParse)

template.compile = (parsed, options = {}) =>
  compileTemplate(
    parsed, //
    { locate, jsonParse, ...options }
  )

template.format = (parsed, locals, actions) =>
  compileTemplate(
    parsed, //
    { locate, jsonParse, actions, locals }
  )(locals)

template.formatAsync = async (parsed, locals, actions) =>
  compileTemplate(
    parsed, //
    { locate, jsonParse, actions, locals, async: true }
  )(locals)

template.render = (source, locals, actions) =>
  compileTemplate(
    parseTemplate(source, jsonParse), //
    { locate, jsonParse, actions, locals }
  )(locals)

template.renderAsync = async (source, locals, actions) =>
  compileTemplate(
    parseTemplate(source, jsonParse), //
    { locate, jsonParse, actions, locals, async: true }
  )(locals)
