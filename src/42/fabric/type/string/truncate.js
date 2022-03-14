// @thanks https://www.30secondsofcode.org/js/s/truncate-string-at-whitespace

const DEFAULTS = {
  max: 80,
  ending: "…",
  firstBreak: undefined,
  lastBreak: undefined,
}

export default function truncate(str, options) {
  if (typeof options === "number") options = { max: options }
  const config = { ...DEFAULTS, ...options }
  let { max, ending, firstBreak, lastBreak } = config

  max -= ending.length
  if (str.length < max) return str

  if (firstBreak) {
    const firstIndex = str.slice(0, max + 1).indexOf(firstBreak)
    return str.slice(0, firstIndex > 0 ? firstIndex : max) + ending
  }

  if (lastBreak) {
    const lastIndex = str.slice(0, max + 1).lastIndexOf(lastBreak)
    return str.slice(0, lastIndex > 0 ? lastIndex : max) + ending
  }

  return str.slice(0, max) + ending
}
