// @thanks https://github.com/bestiejs/punycode.js
//! Copyright Mathias Bynens <https://mathiasbynens.be/>. MIT License.
// @read https://mathiasbynens.be/notes/javascript-encoding

export function countLetters(str) {
  let length = 0
  const len = str.length
  let pos = 0
  let value
  while (pos < len) {
    length++
    value = str.charCodeAt(pos++)
    if (value >= 0xd8_00 && value <= 0xdb_ff && pos < len) {
      value = str.charCodeAt(pos)
      if ((value & 0xfc_00) === 0xdc_00) pos++
    }
  }

  return length
}

export function countBytes(str) {
  return new TextEncoder().encode(str).byteLength
}

export function countWords(str) {
  return str.split(" ").filter((n) => n !== "").length
}

export default {
  letters: countLetters,
  words: countWords,
  bytes: countBytes,
}
