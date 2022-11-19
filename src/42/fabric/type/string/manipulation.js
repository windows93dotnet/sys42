import deburr from "./deburr.js"
import pluralize from "./pluralize.js"
import { countLetters, countWords, countBytes } from "./count.js"
import { trim, trimStart, trimEnd } from "./trim.js"

import toCamelCase from "./case/toCamelCase.js"
import toCapitalCase from "./case/toCapitalCase.js"
import toConstantCase from "./case/toConstantCase.js"
import toHeaderCase from "./case/toHeaderCase.js"
import toKebabCase from "./case/toKebabCase.js"
import toLowerCase from "./case/toLowerCase.js"
import toNoCase from "./case/toNoCase.js"
import toPascalCase from "./case/toPascalCase.js"
import toSentenceCase from "./case/toSentenceCase.js"
import toSnakeCase from "./case/toSnakeCase.js"
import toTitleCase from "./case/toTitleCase.js"
import toUpperCase from "./case/toUpperCase.js"

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
  split: (str, delimiter) => str.split(delimiter),
  repeat: (str, num) => str.repeat(num),
  replace: (str, ...rest) => str.replace(...rest),
  replaceAll: (str, ...rest) => str.replaceAll(...rest),
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
}
