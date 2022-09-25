import system from "../../system.js"
import inNode from "../env/runtime/inNode.js"
import inDeno from "../env/runtime/inDeno.js"

const cwd = inNode
  ? process.cwd
  : inDeno
  ? Deno.cwd
  : () => system.shell?.cwd ?? "/"

export default cwd
