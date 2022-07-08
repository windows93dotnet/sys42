import inTop from "./env/runtime/inTop.js"
import inIframe from "./env/runtime/inIframe.js"
import hash from "../fabric/type/any/hash.js"
import ipc from "./ipc.js"

const functions = new Map()

if (inTop) {
  ipc
    .on("42-realm-call", ({ digest, args }) => {
      if (functions.has(digest)) {
        return functions.get(digest)(...args)
      }
    })
    .on("42-realm-destroy", ({ digest }) => {
      functions.delete(digest)
    })
}

let bus

function wrap(digest, fn) {
  fn.destroy = inTop
    ? async () => functions.delete(digest)
    : async () => bus.send("42-realm-destroy", digest)
  return fn
}

export default function realm(argsWrapper, fn) {
  if (fn === undefined) {
    fn = argsWrapper
    argsWrapper = undefined
  }

  const digest = hash(fn)

  if (!inTop) {
    bus ??= ipc.to(globalThis.top)
    return wrap(
      digest,
      argsWrapper
        ? async (...args) =>
            bus.send("42-realm-call", {
              digest,
              args: await argsWrapper(...args),
            })
        : async (...args) => bus.send("42-realm-call", { digest, args })
    )
  }

  functions.set(digest, fn)

  return wrap(
    digest,
    argsWrapper
      ? async (...args) => fn(...(await argsWrapper(...args)))
      : async (...args) => fn(...args)
  )
}

realm.inTop = inTop
realm.inIframe = inIframe
