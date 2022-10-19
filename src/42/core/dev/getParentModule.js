import stackTrace from "../../fabric/type/error/stackTrace.js"

export default function getParentModule(reg) {
  const stack = stackTrace(new Error(), { internals: true })
  stack.shift()

  let last = 0
  let firstInternalsPassed = false

  for (let i = 0, l = stack.length; i < l; i++) {
    const item = stack[i]
    if (item.filename.startsWith("/internal/")) {
      if (firstInternalsPassed) break
      else {
        firstInternalsPassed = true
        continue
      }
    }

    if (reg) {
      if (reg.test(item.filename)) last = i
    } else {
      last = i
    }
  }

  const url = stack[last].filename

  return { url, stack }
}
