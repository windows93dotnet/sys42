import system from "../system.js"
import inNode from "./env/runtime/inNode.js"
import inDeno from "./env/runtime/inDeno.js"

const Shell = await import(
  `./shell/${inNode ? "Node" : inDeno ? "Deno" : "Browser"}Shell.js`
).then((m) => m.default)

export { Shell }

system.shell ??= new Shell()

export default system.shell
