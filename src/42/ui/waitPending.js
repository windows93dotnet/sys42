export async function waitPending(stage, n = 10) {
  await Promise.all([
    stage.waitlistPrerender.done(),
    stage.waitlistComponents.done(),
  ])

  await stage.reactive.pendingUpdate
  // await 0 // queueMicrotask

  if (
    stage.waitlistPrerender.length > 0 ||
    stage.waitlistComponents.length > 0
  ) {
    if (n < 0) throw new Error("Too much recursion")
    await waitPending(stage, --n)
  }
}

export default waitPending
