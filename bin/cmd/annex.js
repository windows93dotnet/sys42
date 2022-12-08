import system from "../../src/42/system.js"
import filterTasks from "./annex/filterTasks.js"
import findOrigin from "./annex/findOrigin.js"

const task = system.config.tasks.annex

export default async function annex() {
  const { annexes } = system.config

  task.log(` start annexing`)

  const undones = []

  for (const item of filterTasks(annexes)) {
    if (item.from) Object.assign(item, findOrigin(item.from))

    undones.push(
      import(`./annex/providers/${item.type}.js`) //
        .then((m) => m.default(item))
    )
  }

  const res = await Promise.all(undones)

  task.log(res)
}
