export default function difference(arr, ...args) {
  args = args.flat()
  return arr.filter((item) => !args.includes(item))
}
