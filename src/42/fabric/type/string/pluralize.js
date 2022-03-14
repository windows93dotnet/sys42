export default function pluralize(num, word, plural = word + "s") {
  num = Number(num)
  return num === 1 || num === -1 ? word : plural
}
