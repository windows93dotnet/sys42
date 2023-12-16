import untilNextTask from "../promise/untilNextTask.js"

export default function synchronize(fn) {
  const stack = []
  return async (...args) => {
    await Promise.all([untilNextTask(), stack.pop()])
    const res = fn(...args)
    stack.push(res)
    return res
  }
}
