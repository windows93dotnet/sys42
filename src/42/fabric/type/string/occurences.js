/**
 * Function that count occurrences of a substring in a string;
 *
 * @param {string} str  The string
 * @param {string} search  The sub string to search for
 * @param {object} [options]
 * @param {boolean} [options.overlap=false]  Allow overlapping
 * @returns {number}
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
 */
export default function occurrences(str, search, options) {
  str = String(str)
  search = String(search)
  if (search.length <= 0) return str.length + 1

  let n = 0
  let pos = 0
  const step = options?.overlap ? 1 : search.length

  while (true) {
    pos = str.indexOf(search, pos)
    if (pos >= 0) {
      ++n
      pos += step
    } else break
  }

  return n
}
