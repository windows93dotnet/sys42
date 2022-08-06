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

function wrap(name, digest, returns, fn) {
  fn.destroy = inTop
    ? async () => functions.delete(digest)
    : async () => ipc.to.top.send("42-realm-destroy", digest)
  Object.defineProperty(fn, "name", { value: name })

  if (returns) {
    return async (...args) => {
      const res = await fn(...args)
      return returns(res)
    }
  }

  return fn
}

export default function xrealm({ name, args, returns, main }) {
  const digest = hash(main)

  if (!inTop) {
    const fn = args
      ? async (...rest) =>
          ipc.to.top.send("42-realm-call", {
            digest,
            args: await args(...rest),
          })
      : async (...args) => ipc.to.top.send("42-realm-call", { digest, args })

    return wrap(name, digest, returns, fn)
  }

  functions.set(digest, main)

  const fn = args //
    ? async (...rest) => main(...(await args(...rest)))
    : main

  return wrap(name, digest, returns, fn)
}

xrealm.inTop = inTop
xrealm.inIframe = inIframe
