import ipc from "../../../42/core/ipc.js"
import env from "../../../42/core/env.js"
const event = new URLSearchParams(location.search).get("event")
ipc.to.top.emit(event, env)
