export default function isPromiseLike(x) {
  const type = typeof x
  return (
    x !== null &&
    (type === "object" || type === "function") &&
    typeof x.then === "function"
  )
}
