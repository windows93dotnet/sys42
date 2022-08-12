import ipc from "../../../42/core/ipc.js"
import env from "../../../42/core/env.js"
ipc.emit(location.search.slice(3), env)
