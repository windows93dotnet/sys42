import inNode from "../../../core/env/runtime/inNode.js"
import inDeno from "../../../core/env/runtime/inDeno.js"
import system from "../../../system.js"

const cwd = inNode
  ? process.cwd
  : inDeno
  ? Deno.cwd
  : () => system.shell?.cwd ?? "/"

export default cwd
