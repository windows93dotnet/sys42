import untilNextTask from "../promise/untilNextTask.js"

export function synchronize(fn) {
  const stack = []

  const synchronized = async (...args) => {
    await Promise.all([untilNextTask(), stack.pop()])
    const res = fn(...args)
    stack.push(res)
    return res
  }

  synchronized.originalFn = fn
  return synchronized
}

export default synchronize
