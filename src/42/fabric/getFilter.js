// @read https://jinja.palletsprojects.com/en/3.0.x/templates/#builtin-filters
// @read https://ansible-docs.readthedocs.io/zh/stable-2.0/rst/playbooks_filters.html

import locate from "./locator/locate.js"

const filters = {}

const STRING_FILTER = { url: "string/stringFilters", key: true }

filters.string = {
  slice: STRING_FILTER,
  replace: STRING_FILTER,
  nospace: STRING_FILTER,
  deburr: "string/deburr",
  pluralize: "string/pluralize",
  camel: STRING_FILTER,
  capital: STRING_FILTER,
  constant: STRING_FILTER,
  header: STRING_FILTER,
  kebab: STRING_FILTER,
  lower: STRING_FILTER,
  nocase: STRING_FILTER,
  pascal: STRING_FILTER,
  sentence: STRING_FILTER,
  snake: STRING_FILTER,
  title: STRING_FILTER,
  upper: STRING_FILTER,
}

filters.number = {
  ceil: { url: "number/precision", key: true },
  floor: { url: "number/precision", key: true },
  round: { url: "number/precision", key: true },
  add: (a, b) => a + b,
  minus: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  modulo: (a, b) => a % b,
}

filters.array = {
  difference: "array/difference",
  groupBy: "array/groupBy",
  join: (arr, separator) => arr.join(separator),
  removeItem: "array/removeItem",
  shuffle: "array/shuffle",
  slice: STRING_FILTER,
  union: "array/union",
  uniq: "array/uniq",
}

filters.object = {
  fromEntries: (obj) => Object.fromEntries(obj),
  entries: (obj) => Object.entries(obj),
  keys: (obj) => Object.keys(obj),
  values: (obj) => Object.values(obj),
  allKeys: "object/allKeys",
  omit: "object/omit",
  pick: "object/pick",
}

filters.any = {
  arrify: "any/arrify",
  cast: "any/cast",
  clone: "any/clone",
  equal: "any/equal",
  stringify: "any/stringify",
}

filters.path = {
  // formatPath: "path/core/formatPath",
  // joinPath: "path/core/joinPath",
  // normalizePath: "path/core/normalizePath",
  // parsePath: "path/core/parsePath",
  postfixPath: "path/core/postfixPath",
  prefixPath: "path/core/prefixPath",
  relativePath: "path/core/relativePath",
  removeExt: "path/core/removeExt",
  replaceExt: "path/core/replaceExt",
  resolvePath: "path/core/resolvePath",
  // sortGlobResults: "path/core/sortGlobResults",
  sortPath: "path/core/sortPath",

  extname: "path/extract/extname",
  dirname: "path/extract/dirname",
  basename: "path/extract/basename",
  stemname: "path/extract/stemname",
}

filters.dom = {
  autoselect(text) {
    // requestAnimationFrame(() => {
    //   console.log(this.value)
    //   const start = this.value.indexOf(text)
    //   if (start > -1) {
    //     const end = start + text.length
    //     console.log(start, end)
    //     // this.focus()

    //     const selection = window.getSelection()

    //     if (selection.rangeCount > 0) selection.removeAllRanges()

    //     const range = document.createRange()
    //     range.setStart(this, start)
    //     range.setEnd(this, end)
    //     // range.setEnd(this, start)
    //     // this.setSelectionRange(start, start + text.length)

    //     selection.addRange(range)
    //   }
    // })

    const { el, ctx } = this
    const { signal } = ctx.cancel

    el.addEventListener(
      "focus",
      () => {
        const start = el.value.indexOf(text)
        if (start > -1) el.setSelectionRange(start, start + text.length)
      },
      { signal }
    )

    return text
  },
}

const entries = Object.entries(filters)

export default async function getFilter(name) {
  for (const [, val] of entries) {
    if (name in val) {
      const item = val[name]
      let fn = item.url ?? item
      if (typeof fn === "string") {
        fn = await import(`./type/${fn}.js`).then((m) =>
          item.key
            ? locate(m.default, name)
            : item.import
            ? locate(m, item.import)
            : m.default
        )
      }

      return fn
    }
  }
}
