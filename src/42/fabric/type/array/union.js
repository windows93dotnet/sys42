import uniq from "./uniq.js"
export default function union(...args) {
  return uniq(args.flat())
}
