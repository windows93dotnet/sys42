export default function pluralize(word, num = 2, plural = word + "s") {
  num = Number(num)
  return num === 1 || num === -1 ? word : plural
}
