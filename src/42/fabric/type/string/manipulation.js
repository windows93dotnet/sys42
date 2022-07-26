import deburr from "./deburr.js"
import pluralize from "./pluralize.js"
import { countLetters, countWords, countBytes } from "./count.js"
import { trim, trimStart, trimEnd } from "./trim.js"

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
  camelCase: toCamelCase,
  capitalCase: toCapitalCase,
  constantCase: toConstantCase,
  headerCase: toHeaderCase,
  kebabCase: toKebabCase,
  lowerCase: toLowerCase,
  nocaseCase: toNoCase,
  pascalCase: toPascalCase,
  sentenceCase: toSentenceCase,
  snakeCase: toSnakeCase,
  titleCase: toTitleCase,
  upperCase: toUpperCase,

  nospace: (str) => str.replace(/\s+/g, "_"),
  slice: (str, ...rest) => str.slice(...rest),
  split: (str, sep) => str.split(sep),
  repeat: (str, num) => str.repeat(num),
  replace: (str, ...rest) => str.replace(...rest),
  padEnd: (str, length, padString) => str.padEnd(length, padString),
  padStart: (str, length, padString) => str.padStart(length, padString),
  endsWith: (str, search) => str.endsWith(search),
  startsWith: (str, search) => str.startsWith(search),

  deburr,
  pluralize,

  countLetters,
  countWords,
  countBytes,

  trim,
  trimStart,
  trimEnd,

  // TODO:
  // normalize
}
