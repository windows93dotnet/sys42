import mark from "./mark.js"
import sdbm from "../string/sdbm.js"

export default function hash(any) {
  const h = sdbm(mark(any))
  return (
    String.fromCharCode(97 + (Number(h.toString(10).slice(-2)) % 26)) +
    (h.toString(32) + (h * 1e10).toString(16)).slice(0, 11)
  )
}
