import settings from "../../src/42/core/settings.js"
import argv from "../../src/42/os/cli/argv.js"
import parseCommand from "../../src/42/os/cli/parseCommand.js"
// import validator from "../type/json/validator.js"
import Callable from "../../src/42/fabric/classes/Callable.js"

const DEFAULTS = {
  validator: {},
  schema: {},
  count: [],
  aliases: {},
  presets: {},
  print: {},
}

export const PRESETS = {
  verbose: {
    schema: { verbose: { type: "number" } },
    count: ["verbose"],
    globalOptions: ["silent"],
    aliases: { v: "verbose", s: "silent" },
    presets: { silent: { verbose: 0 } },
  },
}

const configure = settings("CLI", DEFAULTS, PRESETS)

export default class CLI extends Callable {
  constructor(...options) {
    super((args) => this.run(args))
    this.config = configure(...options)
    this.print = Object.entries(this.config.print)
    // if (this.config.validator) {
    //   this.validate = validator(
    //     { properties: this.config.schema },
    //     this.config.validator
    //   )
    // }
  }

  async initAsync() {
    if (this.config.validator) {
      await this.validate.initAsync()
    }
  }

  run(args) {
    args = Array.isArray(args) ? args : parseCommand(args)
    this.options = argv(args, this.config)

    for (const [key, value] of this.print) {
      if (key in this.options) {
        return typeof value === "function" ? value(this) : value
      }
    }

    // if (this.config.validator) {
    //   this.validateOutput = this.validate(this.options)
    //   if (!this.validateOutput.valid) {
    //     throw Object.assign(new TypeError("arguments failed validation"), {
    //       errors: this.validateOutput.errors[0].errors,
    //     })
    //   }
    // }

    return this.options
  }
}
