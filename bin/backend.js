import system from "../src/42/system.js"
import userConfig, { CLI_TASKS } from "./utils/userConfig.js"
import inNode from "../src/42/core/env/runtime/inNode.js"
import trap from "../src/42/fabric/type/error/trap.js"
import log from "../src/42/core/log.js"
import propagateConfig from "./utils/propagateConfig.js"
import fs from "node:fs/promises"

trap((err, title) => {
  log(`\n💥 ${title}:`, err)
})

const args = inNode ? process.argv.slice(2) : Deno.args.slice(1)
const config = await userConfig(args)

system.config = config
system.tasks = {}
system.unclosed = new Set()
propagateConfig(config)

system.on("backend:restart", async () => {
  log.yellow(`\n⚡ restart\n`)
  for (const unclosed of system.unclosed) unclosed?.()
  process.send("restart")
})

async function greet() {
  if (!config.greet || config.verbose < 1) return
  const line1 = []
  const line2 = []

  for (let i = 0, l = CLI_TASKS.length; i < l; i++) {
    const [icon, name, color] = CLI_TASKS[i]
    const active = config.run.includes(name) && !config.ignore.includes(name)
    const line = i >= l / 2 ? line2 : line1
    line.push(`${icon} {${active ? color : "grey"} ${name}}  `)
  }

  const verbose =
    config.verbose > 1 ? ` verbose {magenta ${config.verbose}}` : ""

  const { version } = JSON.parse(
    await fs.readFile(new URL("../package.json", import.meta.url), "utf-8")
  )

  log[config.dev ? "yellow" : "cyanBright"](`
  ╷ ┌───┐   ${line1.join("")}
  └─┤ ┌─┘   ${line2.join("")}
    └─┴─╴   {grey v${version}}${verbose}${
    config.dev ? " {yellow 🛠️ dev} " : ""
  }\n`)
}

function exit(res) {
  let exit = 0

  for (const code of res) {
    if (typeof code !== "number") return
    exit |= code
  }

  process.exit(exit)
}

await greet()

const res = await Promise.all(
  config.run.map((task) =>
    import(`./cmd/${task}.js`).then(async (m) => {
      system.tasks[task] = m.default
      const res = await system.tasks[task]()
      return config.ignore.includes(task) ? 0 : res
    })
  )
)

exit(res)
