import timeout from "../type/promise/timeout.js"
import TimeoutError from "../errors/TimeoutError.js"

export default class Tasks extends Array {
  then(resolve, reject) {
    return this.done().then(resolve, reject)
  }

  async done(ms = 5000, err) {
    err ??= new TimeoutError(`Tasks timed out: ${ms}ms`)
    const tasks = this.map((task) =>
      typeof task === "function" ? task() : task,
    )
    return Promise.race([
      timeout(ms, err),
      Promise.all(tasks).then((res) => {
        this.length = 0
        return res
      }),
    ])
  }
}
