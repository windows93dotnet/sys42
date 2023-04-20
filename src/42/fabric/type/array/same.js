/**
 * Function that check if every item in a list are the same
 *
 * @param {string} arr the list
 * @param {string} [item] the item to compare (default to the first item in the list)
 * @returns {boolean}
 */
export function same(arr, item = arr[0]) {
  let i = arr.length
  while (i--) if (arr[i] !== item) return false
  return true
}

export default same
