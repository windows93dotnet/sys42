const { random } = Math

export function shuffle(arr, r = random) {
  let l = arr.length
  while (l) {
    const i = (r() * l--) | 0
    const tmp = arr[i]
    arr[i] = arr[l]
    arr[l] = tmp
  }

  return arr
}

export default shuffle
