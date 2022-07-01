export default function walkCSSRules(cb) {
  function walk(sheet) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      return
    }

    if (rules) {
      for (let i = 0, l = rules.length; i < l; i++) {
        const rule = rules[i]
        const res = cb(rule, i, sheet)
        if (res === false) return
        if (rule.styleSheet) walk(rule.styleSheet)
      }
    }
  }

  for (let i = 0, l = document.styleSheets.length; i < l; i++) {
    walk(document.styleSheets[i])
  }
}
