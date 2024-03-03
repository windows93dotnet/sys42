import ipc from "../ipc.js"
import hash from "../../fabric/type/any/hash.js"
import traverse from "../../fabric/type/object/traverse.js"
import SecurityError from "../../fabric/errors/SecurityError.js"
import ElementController from "./ElementController.js"

const { inTop, inIframe } = ipc

const CALL = "42_RPC_CALL"
const DESTROY = "42_RPC_DESTROY"
const callers = new Map()

function serialize(val) {
  const forgets = []

  traverse(val, (key, fn, obj) => {
    if (typeof fn === "function") {
      const id = "42_RPC_FUNCTION_" + hash(fn.original ?? fn)
      forgets.push(ipc.on(id, { off: true }, (args) => fn(...args)))
      obj[key] = id
    }
  })

  const destroy = () => {
    for (const forget of forgets) forget()
  }

  return { val, destroy }
}

function deserialize(val, { send }) {
  return traverse(val, (key, id, obj) => {
    if (typeof id === "string" && id.startsWith("42_RPC_FUNCTION_")) {
      obj[key] = async (...args) => {
        const [res] = await send(id, args)
        return res
      }
    }
  })
}

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
        const res = await callers.get(id)(...deserialize(args, meta), meta)
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
      callers.delete(id)
    })
}

async function remoteCall(data) {
  const res = await ipc.send(CALL, data)

  if (res && "42_ELEMENT_CONTROLLER" in res) {
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

  if (!inTop) {
    const info = {
      name: fn.name ? `"${fn.name}"` : "corresponding",
      module: options?.module,
    }
    const stub =
      unmarshalling && marshalling
        ? async (...args) => {
            const packed = await marshalling(...args)
            if (packed === false) return
            const { val, destroy } = serialize(packed)
            const res = await unmarshalling(await remoteCall([id, val, info]))
            destroy()
            return res
          }
        : unmarshalling
          ? async (...args) => unmarshalling(await remoteCall([id, args, info]))
          : marshalling
            ? async (...args) => {
                const packed = await marshalling(...args)
                if (packed === false) return
                const { val, destroy } = serialize(packed)
                const res = await remoteCall([id, val, info])
                destroy()
                return res
              }
            : async (...args) => remoteCall([id, args, info])

    stub.destroy = async () => ipc.send(DESTROY, id)

    return stub
  }

  const caller = async (...args) => {
    const res = await fn(...args)
    if (res?.nodeType === Node.ELEMENT_NODE) return new ElementController(res)
    return res
  }

  callers.set(id, caller)

  const stub =
    unmarshalling && marshalling
      ? async (...args) => {
          const res = await marshalling(...args)
          if (res === false) return
          return Array.isArray(res)
            ? unmarshalling(await caller(...res))
            : unmarshalling(await caller(res))
        }
      : unmarshalling
        ? async (...args) => unmarshalling(await caller(...args))
        : marshalling
          ? async (...args) => {
              const res = await marshalling(...args)
              if (res === false) return
              return Array.isArray(res) ? caller(...res) : caller(res)
            }
          : caller

  stub.destroy = async () => callers.delete(id)

  return stub
}

rpc.inTop = inTop
rpc.inIframe = inIframe
Object.freeze(rpc)
