// @related https://github.com/userpixel/micromustache
// @read https://web.dev/sanitizer/
// @read https://web.dev/trusted-types/

import locate from "../locator/locate.js"
import parseTemplate from "./template/parseTemplate.js"
import formatTemplate from "./template/formatTemplate.js"
import makeTemplate from "./template/makeTemplate.js"
import JSON5 from "./json5.js"

const jsonParse = JSON5.parse

export default function template(source) {
  const parsed = parseTemplate(source, jsonParse)
  return (locals, filters) =>
    formatTemplate(parsed, locals, { filters, locate })
}

template.make = makeTemplate

template.parse = (source) => parseTemplate(source, jsonParse)

template.format = (parsed, locals, filters) =>
  formatTemplate(parsed, locals, { filters, locate, jsonParse })

template.format.async = async (parsed, locals, filters) =>
  formatTemplate(parsed, locals, { filters, locate, jsonParse, async: true })

template.render = (source, locals, filters) =>
  formatTemplate(
    parseTemplate(source, jsonParse), //
    locals,
    { filters, locate, jsonParse }
  )
