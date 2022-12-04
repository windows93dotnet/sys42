// TODO: add Sanitizer polyfill

/*
import ALLOWED_HTML_TAGS from "../../fabric/constants/ALLOWED_HTML_TAGS.js"
import ALLOWED_SVG_TAGS from "../../fabric/constants/ALLOWED_SVG_TAGS.js"
import ALLOWED_HTML_ATTRIBUTES from "../../fabric/constants/ALLOWED_HTML_ATTRIBUTES.js"
import ALLOWED_SVG_ATTRIBUTES from "../../fabric/constants/ALLOWED_SVG_ATTRIBUTES.js"

const all = ["*"]
const namespace = "http://www.w3.org/2000/svg"
const allowElements = [
  ...ALLOWED_HTML_TAGS,
  ...ALLOWED_SVG_TAGS.map((name) => ({ name, namespace })),
  "ui-picto",
]
const allowAttributes = Object.fromEntries(
  [...ALLOWED_HTML_ATTRIBUTES, ...ALLOWED_SVG_ATTRIBUTES] //
    .map((attr) => [attr, all])
)

const sanitizer = new Sanitizer({
  allowCustomElements: true,
  allowUnknownMarkup: true,
  allowComments: true,
  allowElements,
  allowAttributes,
})

export function sanitize(str) {
  const div = document.createElement("div")
  div.setHTML(str, { sanitizer })
  return div.firstChild
}

export default sanitize
*/

export function sanitize(str) {
  const div = document.createElement("div")
  div.innerHTML = str
  return div.firstElementChild
}

export default sanitize
