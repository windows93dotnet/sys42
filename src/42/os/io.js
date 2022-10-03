import Emitter from "../fabric/class/Emitter.js"
import ipc from "../core/ipc.js"
import listen from "../fabric/event/listen.js"
import dt from "../core/dt.js"

ipc.on("42_DROP_EVENT", (dt) => {
  console.log("42_DROP_EVENT", dt)
})

listen(globalThis, {
  prevent: true,
  dragover(e) {
    console.log(e.type)
  },
  drag(e) {
    console.log(e.type)
  },
  async drop(e) {
    console.log(await dt.import(e.dataTransfer))
  },
})

export class IO extends Emitter {}

const io = new IO()

export default io
