import mark from "./mark.js"
import sdbm from "../string/sdbm.js"

export default function hash(any) {
  return (sdbm(mark(any)) * 1e10).toString(36)
}
