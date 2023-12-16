import queueTask from "../function/queueTask.js"

export async function untilNextTask() {
  await new Promise((resolve) => queueTask(resolve))
}

export default untilNextTask
