// @src https://stackoverflow.com/a/55292366

export const trimStart = (str, ch = " \t\n") => {
  let start = 0
  while (ch.includes(str[start])) ++start
  return start > 0 ? str.slice(start, str.length) : str
}

export const trimEnd = (str, ch = " \t\n") => {
  let end = str.length
  while (ch.includes(str[end - 1])) --end
  return end < str.length ? str.slice(0, end) : str
}

export function trim(str, ch = " \t\n") {
  let start = 0
  let end = str.length
  while (start < end && ch.includes(str[start])) ++start
  while (end > start && ch.includes(str[end - 1])) --end
  return start > 0 || end < str.length ? str.slice(start, end) : str
}

export default trim
