import stackTrace from "./stackTrace.js"
import allKeys from "../object/allKeys.js"
import addStack from "./addStack.js"
import omit from "../object/omit.js"

const ERROR_EVENT_INFOS = ["lineno", "colno", "filename"]

export default function serializeError(error) {
  const details = {}

  const keys =
    error instanceof DOMException
      ? Object.keys(error) // prevent legacy constant codes
      : allKeys(error)

  for (const key of keys) details[key] = error[key]

  const original = error.stack
  let { name, message } = error

  delete details.message
  if (details.name === (error.name ?? error.constructor.name)) {
    delete details.name
  }

  if (details.stack === error.stack) delete details.stack
  if (details.codeFrame) delete details.codeFrame
  if (details.fileName) delete details.fileName
  if (details.lineNumber) delete details.lineNumber
  if (details.columnNumber) delete details.columnNumber

  if ("errorEvent" in details) {
    if (!message) message = details.errorEvent.message
    details.errorEvent = omit(details.errorEvent, ERROR_EVENT_INFOS)
  }

  if (error.cause) {
    details.cause = `${error.cause.name}: ${error.cause.message}`
    addStack(error, error.cause)
  }

  const stack = stackTrace(error)

  return {
    name,
    message,
    details,
    stack,
    original,
  }
}
