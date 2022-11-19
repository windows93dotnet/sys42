import system from "../system.js"
import configure, { merge } from "./configure.js"
import freeze from "../fabric/type/object/freeze.js"

import exists from "../fabric/locator/exists.js"
import allocate from "../fabric/locator/allocate.js"
import locate from "../fabric/locator/locate.js"

system.configs ??= {}

const { configs } = system

class Config {
  #original
  constructor(name, defaults, presets) {
    this.name = name
    this.#original = freeze({ defaults, presets })
    this.restore()
  }

  restore() {
    // TODO: experiment with observe.js to make onchange events
    this.defaults = configure(this.#original.defaults)
    this.presets = configure(this.#original.presets)
  }

  edits(defaults, presets) {
    if (defaults) this.defaults = configure(this.#original.defaults, defaults)
    if (presets) this.presets = configure(this.#original.presets, presets)
  }
}

export default function settings(name, defaults, presets) {
  let config

  const segments = exists.separate(name)
  if (exists.run(configs, segments)) {
    config = locate.run(configs, segments)
  } else {
    config = new Config(name, defaults, presets)
    allocate.run(configs, segments, config)
  }

  return (...options) => {
    const { defaults, presets } = config
    return presets
      ? configure(
          defaults,
          ...options.map((opt) => {
            const type = typeof opt

            if (type === "object" && "preset" in opt) {
              const out = Object.create(null)

              const presetList =
                typeof opt.preset === "string"
                  ? opt.preset.split(" ")
                  : opt.preset

              for (const presetName of presetList) {
                if (presetName in presets) merge(out, presets[presetName])
                else throw new TypeError(`Unknown preset: ${presetName}`)
              }

              return configure(out, opt)
            }

            if (type === "string") {
              if (opt in presets) return presets[opt]
              throw new TypeError(`Unknown preset: ${opt}`)
            }

            return opt
          })
        )
      : configure(defaults, ...options)
  }
}
