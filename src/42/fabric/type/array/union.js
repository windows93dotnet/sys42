import uniq from "./uniq.js"

export function union(...args) {
  return uniq(args.flat())
}

export default union
