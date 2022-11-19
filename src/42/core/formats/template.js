// @related https://github.com/userpixel/micromustache
// @read https://web.dev/sanitizer/
// @read https://web.dev/trusted-types/

import parseTemplate from "./template/parseTemplate.js"
import compileTemplate from "./template/compileTemplate.js"
import makeTemplate from "./template/makeTemplate.js"
import escapeTemplate from "./template/escapeTemplate.js"
import JSON5 from "./json5.js"

const parseValue = JSON5.parse

export default function template(source, options) {
  return compileTemplate(parseTemplate(source, parseValue), options)
}

template.make = makeTemplate
template.escape = escapeTemplate

template.parse = (source) => parseTemplate(source, parseValue)

template.compile = (parsed, options) => compileTemplate(parsed, options)

template.format = (parsed, locals, actions) =>
  compileTemplate(parsed, { actions, locals })(locals)

template.formatAsync = async (parsed, locals, actions) =>
  compileTemplate(parsed, { actions, locals, async: true })(locals)

template.render = (source, locals, actions) =>
  compileTemplate(
    parseTemplate(source, parseValue), //
    { actions, locals }
  )(locals)

template.renderAsync = async (source, locals, actions) =>
  compileTemplate(
    parseTemplate(source, parseValue), //
    { actions, locals, async: true }
  )(locals)
