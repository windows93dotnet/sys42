export default function isIterable(val) {
  return val && typeof val[Symbol.iterator] === "function"
}
