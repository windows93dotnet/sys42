// @related https://github.com/ttag-org/ttag
// @related https://github.com/skolmer/es2015-i18n-tag
// @related https://github.com/WebReflection/i18n-utils

import system from "../system.js"
import chainable from "../fabric/trait/chainable.js"
import languages from "./i18n/languages.js"
import pluralize from "../fabric/type/string/pluralize.js"
import makeTemplate from "./formats/template/makeTemplate.js"
import parseTemplate from "./formats/template/parseTemplate.js"
import isTemplateObject from "../fabric/type/any/is/isTemplateObject.js"

system.i18n ??= {
  languages,
  locale: languages[0],
  db: Object.create(null),
}

const sbs = system.i18n

// if (typeof document !== "undefined") {
//   document.documentElement.setAttribute("lang", sbs.locale)
// }

function normalizeConfig(data, options) {
  const out = Object.create(null)
  out.locale = options?.locale ?? data.locale ?? sbs.locale
  out.config = options ?? data.config ?? Object.create(null)
  return out
}

function findContext(locale, context, callback, i = 0) {
  if (locale in sbs.db) {
    const db = sbs.db[locale]
    const ctx = context in db ? db[context] : db.global
    if (ctx) {
      if (callback(ctx) === false) {
        if (db.global && callback(db.global) !== false) return
      } else return
    }
  }

  // look for fallback locales
  if (i < sbs.languages.length) {
    findContext(sbs.languages[i], context, callback, i + 1)
  }
}

function plural({ data }, ...args) {
  const { locale, config } = normalizeConfig(data)

  if (isTemplateObject(args[0])) {
    const [strings, ...substitutions] = args
    let out = strings[0]

    for (let i = 0, l = substitutions.length; i < l; i++) {
      let word = strings[i + 1]
      const trimed = word.trim()
      let plural
      findContext(locale, "plurals", (ctx) => {
        if (trimed in ctx) plural = word.replace(trimed, ctx[trimed])
      })
      findContext(locale, data.for, (ctx) => {
        if (trimed in ctx) word = word.replace(trimed, ctx[trimed])
        else return false
      })
      const n = new Intl.NumberFormat(locale, config.number).format(
        substitutions[i]
      )
      out += n + pluralize(word, substitutions[i], plural)
    }

    return out
  }

  return pluralize(...args)
}

function relative({ data }, options, unit) {
  const { locale, config } = normalizeConfig(data, options)
  if (typeof options === "number") {
    return new Intl.RelativeTimeFormat(locale).format(config, unit)
  }

  return new Intl.RelativeTimeFormat(locale, config)
}

const i18n = chainable(
  {
    configure({ data }, options) {
      data.config = options
    },
    locale({ data }, locale) {
      data.locale = locale
    },
    for({ data }, context) {
      if (context === "global" || context === "plurals") {
        throw new RangeError(`"${context}" is a reserved context keyword`)
      } else data.for = context
    },
    plural,
    p: plural,
    relative,
    r: relative,
    compare({ data }, options) {
      const { locale, config } = normalizeConfig(data, options)
      return new Intl.Collator(locale, config).compare
    },
  },
  ({ data }, strings, ...substitutions) => {
    const { locale, config } = normalizeConfig(data, data.config)

    const template = makeTemplate(strings, ...substitutions)

    findContext(locale, data.for, (ctx) => {
      if (template in ctx === false) return false
      const parsed = parseTemplate(ctx[template])
      strings = parsed.strings

      const tmp = []

      for (const tokens of parsed.substitutions) {
        for (const { value } of tokens) tmp.push(substitutions[value])
      }

      substitutions = tmp
    })

    let out = strings[0]

    for (let i = 0, l = substitutions.length; i < l; i++) {
      let x = substitutions[i]
      const type = typeof x

      if (type === "number") {
        x = new Intl.NumberFormat(locale, config.number).format(x)
      } else if (Array.isArray(x)) {
        x = new Intl.ListFormat(locale, config.list).format(x)
      } else if (x instanceof Date) {
        x = new Intl.DateTimeFormat(locale, config.date).format(x)
      }

      out += x + strings[i + 1]
    }

    return out
  }
)

export default i18n
