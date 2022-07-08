import stackTrace from "./stackTrace.js"
import omit from "../object/omit.js"

const ERROR_EVENT_INFOS = ["lineno", "colno", "filename"]

export default function serializeError(error) {
  const details = { ...error }

  delete details.message

  if (details.name === (error.name ?? error.constructor.name)) {
    delete details.name
  }

  if (details.stack === error.stack) delete details.stack
  if (details.codeFrame) delete details.codeFrame

  if ("errorEvent" in details) {
    if (!error.message) error.message = details.errorEvent.message
    details.errorEvent = omit(details.errorEvent, ERROR_EVENT_INFOS)
  }

  return {
    name: error.name,
    message: error.message,
    details,
    stack: stackTrace(error),
    original: error.stack,
  }
}
