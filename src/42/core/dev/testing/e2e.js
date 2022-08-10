import ExecutionContext from "./ExecutionContext.js"

export default function e2e(fn) {
  let ran = false

  requestIdleCallback(async () => {
    if (ran) return
    await import("../../../fabric/type/error/trap.js").then((m) => m.default())

    const t = new ExecutionContext()
    Object.assign(t.utils, {
      dest: () => document.body,
      collect: (item) => item,
    })
    fn(t, t.utils)
  })

  return async (t) => {
    ran = true
    await fn(t, t.utils)
  }
}
