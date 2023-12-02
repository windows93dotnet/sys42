import ipc from "../ipc.js"
import hash from "../../fabric/type/any/hash.js"
import traverse from "../../fabric/type/object/traverse.js"
import SecurityError from "./SecurityError.js"

const { inTop, inIframe } = ipc

const CALL = "42_RPC_CALL"
const DESTROY = "42_RPC_DESTROY"

const functions = new Map()

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
    .on(CALL, ([id, args, info], meta) => {
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

      if (functions.has(id)) {
        return functions.get(id)(...deserialize(args, meta), meta)
      }

      const help = info.module
        ? `.\nImport this module inside a script running in the main html page:\n${info.module}`
        : ""
      throw new Error(
        `The ${info.name} function isn't registered in the top-level realm${help}`,
      )
    })
    .on(DESTROY, (id) => {
      functions.delete(id)
    })
}

/**
 * Remote procedure call
 * @see https://en.wikipedia.org/wiki/Remote_procedure_call
 */
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
    const caller =
      unmarshalling && marshalling
        ? async (...args) => {
            const res = await marshalling(...args)
            if (res === false) return
            const { val, destroy } = serialize(res)
            const out = await unmarshalling(
              await ipc.send(CALL, [id, val, info]),
            )
            destroy()
            return out
          }
        : unmarshalling
          ? async (...args) =>
              unmarshalling(await ipc.send(CALL, [id, args, info]))
          : marshalling
            ? async (...args) => {
                const res = await marshalling(...args)
                if (res === false) return
                const { val, destroy } = serialize(res)
                const out = await ipc.send(CALL, [id, val, info])
                destroy()
                return out
              }
            : async (...args) => ipc.send(CALL, [id, args, info])

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
