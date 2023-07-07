import isInstanceOf from "../any/is/isInstanceOf.js"
const ERROR_EVENT_INFOS = ["lineno", "colno", "filename", "type", "message"]

export default function normalizeError(e, originStack = new Error().stack) {
  let error = isInstanceOf(e, Error)
    ? e
    : e.error ?? e.reason ?? e.target?.error

  if (!error) {
    error = new Error(
      (e?.message ? e.message + " --- " : "") +
        "Unable to extract information from error",
    )
    error.stack = originStack
  } else if (typeof error !== "object") {
    error = new Error(String(error))
    error.stack = originStack
  }

  if (!error.stack) error.stack = originStack

  if (e.constructor?.name === "ErrorEvent") {
    error.errorEvent = {}
    for (const key of ERROR_EVENT_INFOS) {
      if (key in e) error.errorEvent[key] = e[key]
    }
  }

  // Remove stack in error.message
  if (error.message.match(/\n\s*at /)) {
    const parts = error.message.split(/\n\s*at /)
    if (error.stack.includes(parts[1])) error.message = parts[0]
  }

  return error
}
