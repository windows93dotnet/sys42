// @read https://www.wikiwand.com/en/Remote_procedure_call

import inTop from "../../../42/core/env/runtime/inTop.js"
import inIframe from "../../../42/core/env/runtime/inIframe.js"
import hash from "../../../42/fabric/type/any/hash.js"
import ipc from "../../../42/core/ipc.js"

const CALL = "42-xrealm:call"
const DESTROY = "42-xrealm:call"

const functions = new Map()

if (inTop) {
  ipc
    .on(CALL, ([id, args]) => {
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

xrealm.inTop = true // !!! ATTACK !!!
xrealm.inIframe = inIframe

Object.freeze(xrealm)
