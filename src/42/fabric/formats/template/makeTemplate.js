export default function makeTemplate(strings, ...substitutions) {
  let out = strings[0]
  for (let i = 0, l = substitutions.length; i < l; i++) {
    out += `{{${i}}}` + strings[i + 1]
  }

  return out
}
