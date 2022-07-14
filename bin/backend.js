import system from "../src/42/system.js"
import userConfig, { CLI_TASKS } from "./utils/userConfig.js"
import inNode from "../src/42/system/env/runtime/inNode.js"
import trap from "../src/42/fabric/type/error/trap.js"
import log from "../src/42/system/log.js"
import emittable from "../src/42/fabric/trait/emittable.js"
// import propagateConfig from "./utils/propagateConfig.js"

trap((err, title) => {
  log(`\n💥 ${title}:`, err)
})

const args = inNode ? process.argv.slice(2) : Deno.args.slice(1)
const config = await userConfig(args)

emittable(system)

system.config = config

// propagateConfig(config)
// polyfillConfig(config)

system.tasks = {}
system.unclosed = new Set()

system.on("backend:restart", async () => {
  log.yellow(`\n⚡ restart\n`)
  for (const unclosed of system.unclosed) unclosed?.()
  process.send("restart")
})

function greet() {
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

  log[config.dev ? "yellow" : "cyanBright"](`
  ╷ ┌───┐   ${line1.join("")}
  └─┤ ┌─┘   ${line2.join("")}
    └─┴─╴   {grey v0.0.1}${verbose}${config.dev ? " {yellow 🛠️ dev} " : ""}\n`)
}

function exit(res) {
  let exit = 0

  for (const code of res) {
    if (typeof code !== "number") return
    exit |= code
  }

  process.exit(exit)
}

greet()

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
