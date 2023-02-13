import parseCommand from "./core/cli/parseCommand.js"
import argv from "./core/cli/argv.js"

export async function exec(cmd) {
  const [program, ...args] = parseCommand(cmd)
  const module = await import(`./os/commands/${program}.cmd.js`)
  return module.default(argv(args, module.cli))
}

export default exec
