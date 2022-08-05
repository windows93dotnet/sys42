import sleep from "../promise/sleep.js"

export default function synchronize(fn) {
  const stack = []
  return async (...args) => {
    await sleep(0)
    await stack.pop()
    const res = fn(...args)
    stack.push(res)
    return res
  }
}
