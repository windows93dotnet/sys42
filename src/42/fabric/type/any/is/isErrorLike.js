import isInstance from "../../../isInstance.js"

export default function isErrorLike(val) {
  return (
    val &&
    typeof val === "object" &&
    (isInstance(val, Error) ||
      (val.constructor && val.constructor.name === "ErrorEvent"))
  )
}
