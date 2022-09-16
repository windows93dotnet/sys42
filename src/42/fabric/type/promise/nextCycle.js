import queueTask from "../function/queueTask.js"

export default async function nextCycle() {
  await new Promise((resolve) => queueTask(resolve))
}
