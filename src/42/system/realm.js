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

function wrap(name, digest, fn) {
  fn.destroy = inTop
    ? async () => functions.delete(digest)
    : async () => bus.send("42-realm-destroy", digest)
  Object.defineProperty(fn, "name", { value: name })
  return fn
}

export default function realm({ name, args, top }) {
  const digest = hash(top)

  if (!inTop) {
    bus ??= ipc.to(globalThis.top)

    const fn = args
      ? async (...rest) =>
          bus.send("42-realm-call", {
            digest,
            args: await args(...rest),
          })
      : async (...args) => bus.send("42-realm-call", { digest, args })

    return wrap(name, digest, fn)
  }

  functions.set(digest, top)

  const fn = args //
    ? async (...rest) => top(...(await args(...rest)))
    : top

  return wrap(name, digest, fn)
}

realm.inTop = inTop
realm.inIframe = inIframe
