import timeout from "../type/promise/timeout.js"

export default class Tasks extends Array {
  then(resolve, reject) {
    return this.done().then(resolve, reject)
  }

  async done(delay = 5000, err) {
    err ??= new Error(`Undones timed out: ${delay}ms`)
    const tasks = this.map((task) =>
      typeof task === "function" ? task() : task,
    )
    return Promise.race([
      timeout(delay, err),
      Promise.all(tasks).then((res) => {
        this.length = 0
        return res
      }),
    ])
  }
}
