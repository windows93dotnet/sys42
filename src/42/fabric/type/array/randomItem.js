const { random } = Math

export function randomItem(arr, r = random) {
  return arr[Math.floor(r() * arr.length)]
}

export default randomItem
