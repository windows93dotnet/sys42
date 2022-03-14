import deburr from "../string/deburr.js"
import {
  toCamelCase,
  toCapitalCase,
  toConstantCase,
  toHeaderCase,
  toKebabCase,
  toLowerCase,
  toNoCase,
  toPascalCase,
  toSentenceCase,
  toSnakeCase,
  toTitleCase,
  toUpperCase,
} from "../string/letters.js"

export default {
  slice: (str, ...rest) => str.slice(...rest),
  replace: (str, ...rest) => str.replace(...rest),
  nospace: (str) => str.replace(/\s+/g, "_"),
  deburr,
  camel: toCamelCase,
  capital: toCapitalCase,
  constant: toConstantCase,
  header: toHeaderCase,
  kebab: toKebabCase,
  lower: toLowerCase,
  nocase: toNoCase,
  pascal: toPascalCase,
  sentence: toSentenceCase,
  snake: toSnakeCase,
  title: toTitleCase,
  upper: toUpperCase,

  // TODO:
  // normalize
  // padEnd
  // padStart
  // repeat
  // split
  // trim
  // trimStart
  // trimEnd
}
