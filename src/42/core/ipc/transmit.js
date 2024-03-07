import ipc from "../ipc.js"
import hash from "../../fabric/type/any/hash.js"
import traverse from "../../fabric/type/object/traverse.js"

export function serialize(val, options) {
  return traverse(val, (key, val, obj) => {
    if (typeof val === "function") {
      const fnId = "42_RPC_FUNCTION_" + hash(val.originalFn ?? val)
      ipc.on(fnId, options, (args) => val(...deserialize(args, options)))
      obj[key] = fnId
    }
  })
}

export function deserialize(val, options) {
  const agent = options?.send ? options : ipc
  const signal = options?.signal
  return traverse(val, (key, val, obj) => {
    if (typeof val === "string" && val.startsWith("42_RPC_FUNCTION_")) {
      const fnId = val
      obj[key] = async (...args) => {
        const x = serialize(args, { signal })
        return agent.send(fnId, x)
      }
    }
  })
}

export const transmit = {
  serialize,
  deserialize,
}

export default transmit
