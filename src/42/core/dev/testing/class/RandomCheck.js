// @related https://github.com/leebyron/testcheck-js
// @related https://www.crockford.com/jscheck.html
// @related https://github.com/jsverify/jsverify

import clone from "../../../../fabric/type/any/clone.js"

import { AssertionError } from "./Assert.js"

const checkPredicate = (predicate, args) => {
  try {
    predicate(...clone(args)) // never mutate args
    return false
  } catch (err) {
    return err
  }
}

export default class RandomCheck {
  constructor(t, options, signature, predicate) {
    if (typeof options === "function") {
      predicate = options
      signature = false
      options = {}
    } else if (typeof signature === "function") {
      predicate = signature
      if (Array.isArray(options)) {
        signature = options
        options = {}
      } else {
        signature = false
      }
    } else if (Array.isArray(options)) {
      options.run = options
    }

    if (signature !== false) {
      signature = Array.isArray(signature) === false ? [signature] : signature
    }

    this.t = t
    this.config = { trials: 100, seed: undefined, ...options }
    this.predicate = predicate
    this.signature = signature
  }

  async run(seed = this.config.seed, id) {
    const { t, config, signature, predicate } = this

    let attempts = 0
    const fails = []

    t.gen.init(seed)

    const trials = id === undefined ? config.trials : id

    while (attempts++ < trials) {
      t.timeout("reset")

      if (signature) {
        // TODO: generate JSON schema from signature to prevent incoherents shrunks
        const args = signature.map((fn) => fn())

        if (id !== undefined && attempts !== id) continue

        const error = checkPredicate(predicate, args)
        if (error) {
          const original = { args, error }
          const shrunk = {}
          try {
            // TODO: rewrite using parallel()
            shrunk.args = await t.shrink(args, (newArgs) => {
              if (newArgs.length !== args.length) return false
              const newError = checkPredicate(predicate, newArgs)
              return Boolean(newError)
            })
            shrunk.error = checkPredicate(predicate, shrunk.args)
            fails.push({ original, shrunk, attempts })
          } catch (err) {
            console.warn(t.gen.seed())
            console.warn(err.message)
            console.warn(error)
          }
        }
      } else {
        const error = checkPredicate(predicate, [])
        if (error) {
          const original = { error }
          const shrunk = original
          fails.push({ original, shrunk, attempts })
        }
      }
    }

    if (fails.length > 0) {
      config.id = id
      config.trials = trials
      const check = { seed: t.gen.seed(), config, fails }
      throw new AssertionError(
        `${fails.length + 1}/${config.trials} generated check failed`,
        undefined,
        { check }
      )
    }
  }
}
