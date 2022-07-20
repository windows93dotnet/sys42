import realm from "../core/realm.js"
import getCWD from "../fabric/getCWD.js"

import JSON5 from "../core/formats/json5.js"
import parseCommand from "./cli/parseCommand.js"
import argv from "./cli/argv.js"
import traverse from "../fabric/type/object/traverse.js"
import resolvePath from "../fabric/type/path/core/resolvePath.js"
import disk from "../core/fs/disk.js"

const { HOME } = disk

export default realm(
  (cmd, locals = {}) => {
    locals.cwd ??= getCWD()
    return [cmd, locals]
  },
  async (cmd, locals) => {
    const [name, ...rest] = parseCommand(cmd)

    let program

    const programs = disk.glob(
      [`${HOME}/**/${name}{.cmd,.app}.js`, `**/${name}{.cmd,.app}.js`],
      { sort: false }
    )

    if (programs.length === 0) throw new Error(`"${name}" command not found`)

    let cliOptions = { argsKey: "glob" }

    await import(/* @vite-ignore */ programs[0]).then((m) => {
      program = m.default
      if (m.cli) cliOptions = m.cli
    })

    cliOptions.jsonParse ??= JSON5.parse

    if (!program) return

    const args = argv(rest, cliOptions)

    traverse(args, (key, val, obj) => {
      if (key === cliOptions.argsKey && val.length === 1) {
        const filename = resolvePath(locals.cwd, val[0])
        if (disk.has(filename)) obj.filename = filename
      }
    })

    return program(args, locals)
  }
)
