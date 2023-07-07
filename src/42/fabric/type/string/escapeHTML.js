// @thanks https://www.30secondsofcode.org/js/s/unescape-html

const ENTITIES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
}

const REVERSE_ENTITIES = Object.fromEntries(
  Object.entries(ENTITIES).map(([key, val]) => [val, key]),
)

export const escapeHTML = (str) =>
  str.replaceAll(/["&'<>]/g, (x) => ENTITIES[x])

export const unescapeHTML = (str) =>
  str.replaceAll(/&amp;|&lt;|&gt;|&#39;|&quot;/g, (x) => REVERSE_ENTITIES[x])

export default escapeHTML
