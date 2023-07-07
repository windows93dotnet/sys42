// @related https://github.com/userpixel/micromustache
// @read https://web.dev/sanitizer/
// @read https://web.dev/trusted-types/

import parseTemplate from "./template/parseTemplate.js"
import compileTemplate from "./template/compileTemplate.js"
import makeTemplate from "./template/makeTemplate.js"
import escapeTemplate from "./template/escapeTemplate.js"
import JSON5 from "./json5.js"

const parseValue = JSON5.parse

export default function template(str, locals, options) {
  return compileTemplate(
    parseTemplate(str, parseValue), //
    { ...options, locals },
  )(locals)
}

template.make = makeTemplate

template.escape = escapeTemplate

template.parse = (str) => parseTemplate(str, parseValue)

template.compile = (tokens, options) => compileTemplate(tokens, options)

template.format = (tokens, locals, options) =>
  compileTemplate(tokens, { ...options, locals })(locals)

template.render = template
