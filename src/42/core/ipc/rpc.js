import ipc from "../ipc.js"
import hash from "../../fabric/type/any/hash.js"
import SecurityError from "../../fabric/errors/SecurityError.js"
import ElementController from "./ElementController.js"
import Canceller from "../../fabric/classes/Canceller.js"
import { serialize, deserialize } from "./transmit.js"

const { inTop, inIframe } = ipc

const CALL = "42_RPC_CALL"
const DESTROY = "42_RPC_DESTROY"
const callers = new Map()

if (inTop) {
  ipc
    .on(CALL, async ([id, args, info], meta) => {
      if (
        args.length > 1 &&
        typeof args[1] === "object" &&
        "trusted" in args[1] &&
        meta.iframe &&
        meta.iframe.hasAttribute("sandbox") &&
        !meta.iframe.sandbox.contains("allow-same-origin")
      ) {
        throw new SecurityError(
          "Setting stage.trusted as true is not allowed from sandboxed iframes",
        )
      }

      if (callers.has(id)) {
        const { caller, signal } = callers.get(id)
        const options = { send: meta.send, signal }
        const res = await caller(...deserialize(args, options), meta)
        if (res instanceof ElementController) {
          return {
            "42_ELEMENT_CONTROLLER": res[ElementController.REMOTE_EXPORT],
          }
        }

        return res
      }

      const help = info.module
        ? `.\nImport this module inside a script running in the main html page:\n${info.module}`
        : ""
      throw new Error(
        `The ${info.name} function isn't registered in the top-level realm${help}`,
      )
    })
    .on(DESTROY, (id) => {
      callers.get(id)?.cancel()
      callers.delete(id)
    })
}

async function remoteCall(data) {
  const res = await ipc.send(CALL, data)

  if (res && typeof res === "object" && "42_ELEMENT_CONTROLLER" in res) {
    return new ElementController(res["42_ELEMENT_CONTROLLER"])
  }

  return res
}

/** [Remote Procedure Call](https://en.wikipedia.org/wiki/Remote_procedure_call) */
export default function rpc(fn, options = {}) {
  const { marshalling, unmarshalling } = options
  options.module = options.module
    ? new URL(options.module).pathname // remove origin to allow vhost calls
    : undefined

  const id = hash([fn, options])
  const { cancel, signal } = new Canceller()

  const info = {
    id,
    name: fn.name ? `"${fn.name}"` : "corresponding",
    module: options?.module,
  }

  if (!inTop) {
    const stub =
      unmarshalling && marshalling
        ? async (...args) => {
            const packed = await marshalling(...args, info)
            if (packed === false) return
            const val = serialize(packed, { signal })
            return unmarshalling(await remoteCall([id, val, info]), args, info)
          }
        : unmarshalling
          ? async (...args) => {
              const val = serialize(args, { signal })
              return unmarshalling(
                await remoteCall([id, val, info]),
                args,
                info,
              )
            }
          : marshalling
            ? async (...args) => {
                const packed = await marshalling(...args, info)
                if (packed === false) return
                const val = serialize(packed, { signal })
                return remoteCall([id, val, info])
              }
            : async (...args) => {
                const val = serialize(args, { signal })
                return remoteCall([id, val, info])
              }

    stub.destroy = async () => {
      cancel()
      return ipc.send(DESTROY, id)
    }

    signal.addEventListener("abort", stub.destroy)

    return stub
  }

  const caller = async (...args) => {
    const res = await fn(...args)
    if (res?.nodeType === Node.ELEMENT_NODE) return new ElementController(res)
    return res
  }

  callers.set(id, { caller, signal, cancel })

  const stub =
    unmarshalling && marshalling
      ? async (...args) => {
          const res = await marshalling(...args, info)
          if (res === false) return
          return Array.isArray(res)
            ? unmarshalling(await caller(...res), args, info)
            : unmarshalling(await caller(res), args, info)
        }
      : unmarshalling
        ? async (...args) => unmarshalling(await caller(...args), args, info)
        : marshalling
          ? async (...args) => {
              const res = await marshalling(...args, info)
              if (res === false) return
              return Array.isArray(res) ? caller(...res) : caller(res)
            }
          : caller

  stub.destroy = async () => {
    cancel()
    callers.delete(id)
  }

  signal.addEventListener("abort", stub.destroy)

  return stub
}

rpc.inTop = inTop
rpc.inIframe = inIframe
Object.freeze(rpc)
