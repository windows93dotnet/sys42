import ExecutionContext from "./ExecutionContext.js"
import addUtilities from "./addUtilities.js"
import noop from "../../../fabric/type/function/noop.js"

export default function e2e(fn) {
  let ran = false

  requestIdleCallback(() => {
    if (ran) return
    fn(new ExecutionContext(), { container: document.body, cleanup: noop })
  })

  return async (t, meta) => {
    ran = true
    await fn(t, meta)
  }
}

addUtilities(e2e)
