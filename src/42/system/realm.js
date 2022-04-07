import inOpaqueOrigin from "./env/runtime/inOpaqueOrigin.js"
import inTop from "./env/runtime/inTop.js"
import ipc from "./ipc.js"
import noop from "../fabric/type/function/noop.js"

let realm = noop

if (inTop) {
  ipc.on("REALM", () => {})
}

if (inOpaqueOrigin) {
  realm = () => {
    const channel = ipc.to(globalThis.top)
    channel

    const { proxy } = Proxy.revocable({}, {})

    return proxy
  }
}

export default realm
