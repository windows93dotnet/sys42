export function removeItem(arr, item) {
  const index = arr.indexOf(item)
  if (index !== -1) arr.splice(index, 1)
  return arr
}

export default removeItem
