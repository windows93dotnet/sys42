const { random, round } = Math

// [1] always start with a letter for element's id
export function uid(size = 8, radix = 36, r = random) {
  const n = r()
  return (
    String.fromCharCode(97 + round(n * 25)) + // [1]
    round(n * radix ** (size - 1)).toString(radix)
  ).padStart(size, "a")
}

//! Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>. MIT License.
// @src https://github.com/ai/nanoid/blob/main/async/index.browser.js

export const secure = (size = 21) => {
  let id = ""
  const bytes = crypto.getRandomValues(new Uint8Array(size))

  while (size--) {
    const byte = bytes[size] & 61
    id +=
      byte < 36 //
        ? byte.toString(36)
        : (byte - 26).toString(36).toUpperCase()
  }

  return id
}

uid.secure = secure

export default uid
