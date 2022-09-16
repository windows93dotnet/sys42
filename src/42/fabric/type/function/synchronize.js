import nextCycle from "../promise/nextCycle.js"

export default function synchronize(fn) {
  const stack = []
  return async (...args) => {
    await Promise.all([nextCycle(), stack.pop()])
    const res = fn(...args)
    stack.push(res)
    return res
  }
}
