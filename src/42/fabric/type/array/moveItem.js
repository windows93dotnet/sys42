// @src https://stackoverflow.com/a/5306832
export function moveItem(arr, oldIndex, newIndex) {
  while (oldIndex < 0) oldIndex += arr.length
  while (newIndex < 0) newIndex += arr.length

  if (newIndex >= arr.length) {
    let k = newIndex - arr.length + 1
    while (k--) arr.push(undefined)
  }

  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0])
}

export default moveItem
