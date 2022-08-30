import ipc from "../ipc.js"
import hash from "../../fabric/type/any/hash.js"

const { inTop, inIframe } = ipc

const CALL = "42_RPC_CALL"
const DESTROY = "42_RPC_DESTROY"

const functions = new Map()

if (inTop) {
  ipc
    .on(CALL, ([id, args], meta) => {
      if (
        args.length > 1 &&
        typeof args[1] === "object" &&
        meta.iframe &&
        meta.iframe.hasAttribute("sandbox") &&
        !meta.iframe.sandbox.contains("allow-same-origin")
      ) {
        // ctx.trusted is not allowed from sandboxed iframes
        delete args[1].trusted
      }

      if (functions.has(id)) return functions.get(id)(...args, meta)
      throw new Error("No corresponding function found in rpc target")
    })
    .on(DESTROY, (id) => {
      functions.delete(id)
    })
}

/**
 * Remote procedure call
 * @see https://en.wikipedia.org/wiki/Remote_procedure_call
 */
export default function rpc(fn, options) {
  const { marshalling, unmarshalling } = options
  const id = hash([fn, options])

  if (!inTop) {
    const caller =
      unmarshalling && marshalling
        ? async (...args) => {
            const res = await marshalling(...args)
            if (res === false) return
            return unmarshalling(await ipc.send(CALL, [id, res]))
          }
        : unmarshalling
        ? async (...args) => unmarshalling(await ipc.send(CALL, [id, args]))
        : marshalling
        ? async (...args) => {
            const res = await marshalling(...args)
            if (res === false) return
            return ipc.send(CALL, [id, res])
          }
        : async (...args) => ipc.send(CALL, [id, args])

    caller.destroy = async () => ipc.send(DESTROY, id)

    return caller
  }

  functions.set(id, fn)

  const caller =
    unmarshalling && marshalling
      ? async (...args) => {
          const res = await marshalling(...args)
          if (res === false) return
          return unmarshalling(await fn(...res))
        }
      : unmarshalling
      ? async (...args) => unmarshalling(await fn(...args))
      : marshalling
      ? async (...args) => {
          const res = await marshalling(...args)
          if (res === false) return
          return fn(...res)
        }
      : fn

  caller.destroy = async () => functions.delete(id)

  return caller
}

rpc.inTop = inTop
rpc.inIframe = inIframe
Object.freeze(rpc)
