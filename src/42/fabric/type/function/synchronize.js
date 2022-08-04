import sleep from "../promise/sleep.js"

export default function synchronize(fn) {
  const queue = []
  return async (...args) => {
    await sleep(0)
    await queue.pop()
    const res = fn(...args)
    queue.push(res)
    return res
  }
}
