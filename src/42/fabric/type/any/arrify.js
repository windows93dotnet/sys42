/* eslint-disable eqeqeq */

export default function arrify(...args) {
  return args.flatMap((x) =>
    x == undefined ? [] : typeof x.values === "function" ? [...x.values()] : x
  )
}

arrify.strict = (...args) =>
  args.flatMap((x) =>
    x && typeof x.values === "function" ? [...x.values()] : x
  )
