// @read https://www.wikiwand.com/en/Remote_procedure_call

import hash from "../../fabric/type/any/hash.js"
import ipc from "../ipc.js"

const { inTop, inIframe } = ipc

const CALL = "42_XREALM_CALL"
const DESTROY = "42_XREALM_DESTROY"

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

      if (functions.has(id)) return functions.get(id)(...args)
      throw new Error("No corresponding function found in xrealm target")
    })
    .on(DESTROY, (id) => {
      functions.delete(id)
    })
}

export default function xrealm(fn, options) {
  const { input, output } = options
  const id = hash([fn, options])

  if (!inTop) {
    const caller =
      output && input
        ? async (/* xrealm:subroutine */ ...args) =>
            output(await ipc.to.top.send(CALL, [id, await input(...args)]))
        : output
        ? async (/* xrealm:subroutine */ ...args) =>
            output(await ipc.to.top.send(CALL, [id, args]))
        : input
        ? async (/* xrealm:subroutine */ ...args) =>
            ipc.to.top.send(CALL, [id, await input(...args)])
        : async (/* xrealm:subroutine */ ...args) =>
            ipc.to.top.send(CALL, [id, args])

    caller.destroy = async () => ipc.to.top.send(DESTROY, id)

    return caller
  }

  functions.set(id, fn)

  const caller =
    output && input
      ? async (/* xrealm:top */ ...args) =>
          output(await fn(...(await input(...args))))
      : output
      ? async (/* xrealm:top */ ...args) => output(await fn(...args))
      : input
      ? async (/* xrealm:top */ ...args) => fn(...(await input(...args)))
      : fn

  caller.destroy = async () => functions.delete(id)

  return caller
}

xrealm.inTop = inTop
xrealm.inIframe = inIframe
Object.freeze(xrealm)
