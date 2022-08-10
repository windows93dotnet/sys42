import ExecutionContext from "./ExecutionContext.js"

export default function e2e(fn) {
  let ran = false

  requestIdleCallback(async () => {
    if (ran) return
    await import("../../../fabric/type/error/trap.js").then((m) => m.default())
    fn(new ExecutionContext(), {
      container: document.body,
      collect: (item) => item,
    })
  })

  return async (t, meta) => {
    ran = true
    await fn(t, meta)
  }
}
