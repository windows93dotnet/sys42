import inTop from "../env/runtime/inTop.js"
import inIframe from "../env/runtime/inIframe.js"
import hash from "../../fabric/type/any/hash.js"
import ipc from "../ipc.js"

const CALL = "42-xrealm:call"
const DESTROY = "42-xrealm:call"

const functions = new Map()

let top

if (inTop) {
  ipc
    .on("42-xrealm:call", ([digest, args]) => {
      if (functions.has(digest)) {
        return functions.get(digest)(...args)
      }
    })
    .on("42-xrealm:destroy", (digest) => {
      functions.delete(digest)
    })
} else {
  top = ipc.to.top
}

export default function xrealm(fn, options) {
  const { input, output } = options
  const id = hash(fn)

  if (!inTop) {
    const caller =
      output && input
        ? async (/* xrealm */ ...args) =>
            output(await top.send(CALL, [id, await input(...args)]))
        : output
        ? async (/* xrealm */ ...args) =>
            output(await top.send(CALL, [id, args]))
        : input
        ? async (/* xrealm */ ...args) =>
            top.send(CALL, [id, await input(...args)])
        : async (/* xrealm */ ...args) => top.send(CALL, [id, args])

    caller.destroy = async () => top.send(DESTROY, id)

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
