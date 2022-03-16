import inTop from "../system/env/runtime/inTop.js"
import inIframe from "../system/env/runtime/inIframe.js"
import ipc from "../system/ipc.js"

import parseCommand from "../cli/parseCommand.js"
import argv from "../cli/argv.js"

let bus

if (inTop) ipc.on("main<-exec", (cmd) => exec(cmd))

export default async function exec(cmd) {
  if (inIframe) {
    bus ??= ipc.to(globalThis.parent)
    return bus.send("main<-exec", cmd).then(([res]) => res)
  }

  cmd = cmd.startsWith("$ ") ? cmd.slice(2) : cmd

  const [name, ...rest] = parseCommand(cmd)
  const args = argv(rest, { argsKey: "glob" })

  let program
  try {
    program = await import(`./cmd/${name}.js`).then((m) => m.default)
  } catch {
    console.log(`"${name}" command not found`)
  }

  return program(args)
}
