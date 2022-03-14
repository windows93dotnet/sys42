import inNode from "../../../system/env/runtime/inNode.js"
import inDeno from "../../../system/env/runtime/inDeno.js"
import system from "../../../system.js"

const cwd = inNode
  ? process.cwd
  : inDeno
  ? Deno.cwd
  : () => system.shell?.cwd ?? "/"

export default cwd
