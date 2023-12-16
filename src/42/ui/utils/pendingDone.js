import untilNextTask from "../../fabric/type/promise/untilNextTask.js"

export async function pendingDone(stage, n = 10) {
  await Promise.all([
    stage.waitlistPending.done(),
    stage.waitlistComponents.done(),
  ])

  await stage.reactive.pendingUpdate

  if (stage.waitlistPending.length > 0 || stage.waitlistComponents.length > 0) {
    if (n < 0) throw new Error("Too much recursion")
    await untilNextTask()
    await pendingDone(stage, --n)
  }
}

export default pendingDone
