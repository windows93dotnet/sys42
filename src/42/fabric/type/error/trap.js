import normalizeError from "./normalizeError.js"
import removeItem from "../array/removeItem.js"
import inNode from "../../../system/env/runtime/inNode.js"

export const queue = []

// Error.stackTraceLimit = Infinity

const traceErrorsInTrap = (message, object, originStack) => {
  console.group(`❗ trap: ${message}`)
  console.log(object)
  console.group("origin")
  console.log(originStack)
  console.groupEnd()
  console.groupEnd()
}

const handleError = (type, e, cb, originStack) => {
  const error = normalizeError(e, originStack)

  // close most opened console group
  for (let i = 100; i; i--) console.groupEnd()

  try {
    const title =
      type === "rejection" ? "Unhandled Rejection" : "Uncaught Error"

    const res = cb(error, title, e)

    if (res === false) {
      if (!e.filename?.startsWith("blob:")) e.preventDefault?.()
      e.stopPropagation?.()
      e.stopImmediatePropagation?.()
      return false
    }
  } catch (err) {
    // TODO: check async error in trap to prevent infinite recursions
    traceErrorsInTrap("Error in listener", err, originStack)
  }
}

const handler = (type, e, handlerStack) => {
  trap.hasCrashed = true
  for (let i = queue.length - 1; i >= 0; i--) {
    const [cb, originStack] = handlerStack
      ? [queue[i][0], handlerStack]
      : queue[i]
    if (handleError(type, e, cb, originStack) === false) break
  }
}

const errorHandler = (e) => handler("error", e)
const rejectionHandler = (e) => handler("rejection", e)

let isListening = false
export const forget = inNode
  ? () => {
      isListening = false
      process.off("uncaughtException", errorHandler)
      process.off("unhandledRejection", rejectionHandler)
    }
  : () => {
      isListening = false
      globalThis.removeEventListener("error", errorHandler)
      globalThis.removeEventListener("unhandledrejection", rejectionHandler)
    }

export const listen = inNode
  ? () => {
      isListening = true
      process.on("uncaughtException", errorHandler)
      process.on("unhandledRejection", rejectionHandler)
    }
  : () => {
      isListening = true
      globalThis.addEventListener("error", errorHandler)
      globalThis.addEventListener("unhandledrejection", rejectionHandler)
    }

export default function trap(cb) {
  const instance = [cb, new Error().stack]
  queue.push(instance)
  if (!isListening) listen()
  return () => removeItem(queue, instance)
}

trap.handle =
  (stack = new Error().stack) =>
  (e) =>
    handler("error", e, stack)

trap.queue = queue
trap.hasCrashed = false
