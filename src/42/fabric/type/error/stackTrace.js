// @related https://www.npmjs.com/package/clean-stack
// @read https://github.com/tlrobinson/long-stack-traces

import isNode from "../../../core/env/runtime/inNode.js"
import parseErrorStack, { stackframe } from "./parseErrorStack.js"

// @src https://github.com/tapjs/stack-utils/blob/82097544610b7360e14c496b3eb23aedda53d3d0/index.js#L5
const nodeInternalsToRegex = (n) =>
  new RegExp(
    `(?:\\((?:node:)?${n}(?:\\.js)?:\\d+:\\d+\\)$|^\\s*at (?:node:)?${n}(?:\\.js)?:\\d+:\\d+$)`,
  )

export async function nodeInternals() {
  const { builtinModules } = await import("node:module")
  return [...builtinModules, "bootstrap_node", "node"]
    .map(nodeInternalsToRegex)
    .concat(
      /\((?:node:)?internal\/[^:]+:\d+:\d+\)$/,
      /\s*at (?:node:)?internal\/[^:]+:\d+:\d+$/,
      /\/\.node-spawn-wrap-\w+-\w+\/node:\d+:\d+\)?$/,
    )
}

const NODE_INTERNALS = isNode ? await nodeInternals() : []

const errorEventToStackframe = (err) =>
  stackframe({
    filename: err.filename,
    line: Number(err.lineno),
    column: Number(err.colno),
  })

const addErrorEventStackFrame = (err, stackFrames) => {
  if (
    err.errorEvent.filename === "" &&
    err.errorEvent.lineno === 0 &&
    err.errorEvent.colno === 0
  ) {
    // ignore if not usefull
    return
  }

  const e = errorEventToStackframe(err.errorEvent)

  for (const s of stackFrames) {
    if (
      s.filename === e.filename &&
      s.line === e.line &&
      s.column === e.column
    ) {
      // ignore if allready in stack
      return
    }
  }

  e.function ??= "new ErrorEvent"
  stackFrames.unshift(e)
}

export default function stackTrace(err = new Error(), options = {}) {
  const stackFrames =
    err instanceof Error
      ? parseErrorStack(err)
      : globalThis.ErrorEvent && err instanceof ErrorEvent
        ? [errorEventToStackframe(err)]
        : []

  if ("errorEvent" in err) addErrorEventStackFrame(err, stackFrames)

  const usefullStack = []

  for (const item of stackFrames) {
    if (
      isNode &&
      options.internals !== true &&
      ("source" in item === false ||
        NODE_INTERNALS.some((reg) => item.source.match(reg)))
    ) {
      continue
    }

    item.function = item.function || ""
    item.function = item.function.replace(" [as _onTimeout]", "")

    if (item.function === err.name) continue

    item.filename = item.filename || ""
    item.filename = item.filename.replace(/\?.*$/, "") || "__anonymous__"

    if (
      item.filename.endsWith("trap.js") ||
      item.filename.endsWith("stackTrace.js") ||
      item.filename.endsWith("Assert.js") ||
      item.filename.endsWith("ExecutionContext.js")
    ) {
      continue
    }

    if (
      item.function.endsWith("runTest") &&
      item.filename.endsWith("Suite.js")
    ) {
      break
    }

    usefullStack.push(item)
  }

  return usefullStack
}
