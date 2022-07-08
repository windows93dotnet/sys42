// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com). MIT License.
// @thanks https://github.com/sindresorhus/sdbm/blob/master/index.js
// @thanks https://www.30secondsofcode.org/js/s/sdbm
// @related https://gist.github.com/WebReflection/14d135b9a2b988ea8073d1098b0abd0f

/**
 * Non-cryptographic hash function.
 * Hashes the input string into an unsigned 32-bit integer.
 * @param {string} str
 * @returns {number}
 */

export default function sdbm(str = "") {
  let hash = 0
  for (let i = 0, l = str.length; i < l; i++) {
    hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash
  }

  return hash >>> 0
}
