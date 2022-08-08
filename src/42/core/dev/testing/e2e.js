import ExecutionContext from "./ExecutionContext.js"
import addUtilities from "./addUtilities.js"

export default function e2e(fn) {
  let ran = false

  requestIdleCallback(async () => {
    if (ran) return
    const trap = await import("../../../fabric/type/error/trap.js").then(
      (m) => m.default
    )
    trap()
    fn(new ExecutionContext(), {
      container: document.body,
      destroyable: (item) => item,
    })
  })

  return async (t, meta) => {
    ran = true
    await fn(t, meta)
  }
}

addUtilities(e2e)
