import deburr from "./deburr.js"
import pluralize from "./pluralize.js"
import { countLetters, countWords, countBytes } from "./count.js"

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
} from "./letters.js"

export default {
  slice: (str, ...rest) => str.slice(...rest),
  replace: (str, ...rest) => str.replace(...rest),
  nospace: (str) => str.replace(/\s+/g, "_"),
  deburr,
  pluralize,
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

  countLetters,
  countWords,
  countBytes,

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
