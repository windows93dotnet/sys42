import inTop from "../system/env/runtime/inTop.js"
import inIframe from "../system/env/runtime/inIframe.js"
import ipc from "../system/ipc.js"

import parseCommand from "./cli/parseCommand.js"
import argv from "./cli/argv.js"

let bus

if (inTop) {
  ipc.on("main<-exec", (cmd) => exec(cmd))
}

export default async function exec(cmd) {
  if (inIframe) {
    bus ??= ipc.to(globalThis.parent)
    return bus.send("main<-exec", cmd).then(([res]) => res)
  }

  const [name, ...rest] = parseCommand(cmd)

  let program
  let cli

  await import(`./cmd/${name}.cmd.js`)
    .then((m) => {
      program = m.default
      cli = m.cli
    })
    .catch(() => {
      console.log(`"${name}" command not found`)
    })

  if (!program) return

  if (cli) return program(cli(rest))

  return program(argv(rest, { argsKey: "glob" }))
}
