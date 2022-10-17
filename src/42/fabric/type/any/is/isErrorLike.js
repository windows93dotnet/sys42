import isInstanceOf from "../../../isInstanceOf.js"

export default function isErrorLike(val) {
  return (
    val &&
    typeof val === "object" &&
    (isInstanceOf(val, Error) ||
      (val.constructor && val.constructor.name === "ErrorEvent"))
  )
}
