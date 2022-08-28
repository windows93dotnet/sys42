import normalizeError from "./normalizeError.js"
import removeItem from "../array/removeItem.js"
import inNode from "../../../core/env/runtime/inNode.js"

export const queue = []

let isListening = false
const { stackTraceLimit } = Error

const traceErrorsInTrap = (message, object, originStack) => {
  console.group(`❗ trap: ${message}`)
  console.log(object)
  console.group("origin")
  console.log(originStack)
  console.groupEnd()
  console.groupEnd()
}

const handleError = (type, e, cb, originStack) => {
  const error = type === "report" ? e : normalizeError(e, originStack)

  // close most opened console group
  for (let i = 100; i; i--) console.groupEnd()

  const title =
    type === "rejection"
      ? "Unhandled Rejection"
      : type === "report"
      ? "Report"
      : "Uncaught Error"

  const { reports } = error

  try {
    let res

    if (cb.name === "log") {
      cb.red(title)
      cb(reports ?? error)
      res = false
    } else {
      res = cb(error, { title, reports, e })
    }

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
  trap.caught++
  for (let i = queue.length - 1; i >= 0; i--) {
    const [cb, originStack] = handlerStack
      ? [queue[i][0], handlerStack]
      : queue[i]
    if (handleError(type, e, cb, originStack) === false) break
  }
}

const errorHandler = (e) => handler("error", e)
const rejectionHandler = (e) => handler("rejection", e)

let observer

if (!inNode && "ReportingObserver" in globalThis) {
  observer = new ReportingObserver(
    (reports) => {
      handler(
        "report",
        Object.assign(new Error("Report"), {
          reports: reports.map((x) => x.toJSON()),
        })
      )
    },
    { types: ["crash", "csp-violation"], buffered: true }
  )
}

export const forget = inNode
  ? () => {
      isListening = false
      Error.stackTraceLimit = Infinity
      process.off("uncaughtException", errorHandler)
      process.off("unhandledRejection", rejectionHandler)
    }
  : () => {
      isListening = false
      Error.stackTraceLimit = stackTraceLimit
      observer?.disconnect()
      globalThis.removeEventListener("error", errorHandler)
      globalThis.removeEventListener("unhandledrejection", rejectionHandler)
    }

export const listen = inNode
  ? () => {
      isListening = true
      Error.stackTraceLimit = Infinity
      process.on("uncaughtException", errorHandler)
      process.on("unhandledRejection", rejectionHandler)
    }
  : () => {
      isListening = true
      Error.stackTraceLimit = stackTraceLimit
      observer?.observe()
      globalThis.addEventListener("error", errorHandler)
      globalThis.addEventListener("unhandledrejection", rejectionHandler)
    }

export default function trap(cb) {
  if (cb === undefined) {
    cb = (err) => {
      import("../../../core/log.js").then((m) => m.default(err))
      return false
    }
  }

  const instance = [cb, new Error().stack]
  queue.push(instance)
  if (!isListening) listen()
  return () => {
    removeItem(queue, instance)
    if (queue.length === 0) forget()
  }
}

trap.handle =
  (stack = new Error().stack) =>
  (e) =>
    handler("error", e, stack)

trap.queue = queue
trap.caught = 0
