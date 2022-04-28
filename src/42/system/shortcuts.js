/* eslint-disable max-depth */
/* eslint-disable max-params */

// @read https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/getLayoutMap
// @read https://w3c.github.io/aria/#aria-keyshortcuts

import setup from "./setup.js"
import listen from "../fabric/dom/listen.js"
import signature from "../fabric/dom/signature.js"
import serializeArgs from "../ui/utils/serializeArgs.js"
import getParentMethod from "../fabric/dom/getParentMethod.js"
import expr from "./expr.js"
import locate from "../fabric/locator/locate.js"
import arrify from "../fabric/type/any/arrify.js"
import devices from "./devices.js"

const DEFAULTS = {
  agent: undefined,
  thisArg: undefined,
  signal: undefined,
  // TODO: write schema with descriptions
  preventDefault: false, // prevent default when "true"
  propagate: false, // shortcuts events on element ancestors are active when "true"
  multiple: false, // stop on first rule matching when "false"
  repeatable: false, // allow native repeat events when "true"
  passive: undefined, // if undefined, passive is set to false for keydown and true for other events
  serializeArgs: false, // pass "args" keyword in serializeArgs function
}

const configure = setup("shortcuts", DEFAULTS)

export const parseChord = (sequence) => {
  const types = new Set()
  const chords = []

  const keys = []
  const codes = []
  const pads = []

  sequence.split(/\s+/).forEach((chord) => {
    const keysSub = []
    const codesSub = []
    const padsSub = []
    chord.replace(/\+\+/g, "+Add").replace(/([^+]+)/g, (_, part) => {
      let found = false
      part.replace(/\[([^\]]*)]/, (_, type) => {
        types.add(type.toLowerCase())
        found = true
      })
      if (found) return
      part.replace(/{(?:(\d+):)?([^}]*)}/, (_, n = 1, key) => {
        if (key in devices.aliases.gamepad === false) {
          throw new Error(`${part} is not a valid gamepad key`)
        }

        padsSub.push(`gamepad_${n - 1}_${devices.aliases.gamepad[key]}`)
        types.add("buttondown")
        found = true
      })
      if (found) return
      part.replace(/(<)?([^>]*)(>)?/, (_, open, key, close) => {
        const lower = key.toLowerCase()
        key = devices.aliases.keyboard[lower] || key
        if (open && close) codesSub.push(key)
        else keysSub.push(key)
        found = true
      })
    })
    if (keysSub.length > 0) keys.push(keysSub)
    if (codesSub.length > 0) codes.push(codesSub)
    if (padsSub.length > 0) pads.push(padsSub)
  })

  if (keys.length > 0) chords.push({ index: 0, type: "keys", seq: keys })
  if (codes.length > 0) chords.push({ index: 0, type: "codes", seq: codes })
  if (pads.length > 0) chords.push({ index: 0, type: "gamepads", seq: pads })

  return { chords, types: [...types] }
}

const setRule = (rule, types, eventsToListen) =>
  types.forEach((type) => {
    eventsToListen[type] ??= []
    eventsToListen[type].push(rule)
  })

const normalizeRule = (run, chords, types, eventsToListen, options = {}) => {
  if (typeof run === "object") {
    const { up, down, ...options } = run
    if (down) {
      const rule = { chords, run: down, options }
      setRule(rule, types.length === 0 ? ["keydown"] : types, eventsToListen)
    }

    if (up && types.length === 0) {
      const rule = { chords, run: up, options }
      setRule(rule, ["keyup"], eventsToListen)
    }
  } else {
    if (types.length === 0) types.push("keydown")
    const rule = { chords, run, options }
    setRule(rule, types, eventsToListen)
  }
}

export const normalizeRules = (rules) => {
  if (!rules || typeof rules !== "object") {
    throw new TypeError('The "rules" argument must be an object or an array')
  }

  const eventsToListen = {} // Object.create(null)

  if (Array.isArray(rules)) {
    rules.forEach(({ key, run, type, ...options }) => {
      const { chords, types } = parseChord(key)
      normalizeRule(run, chords, type ? [type] : types, eventsToListen, options)
    })
  } else {
    Object.entries(rules).forEach(([key, run]) => {
      const { chords, types } = parseChord(key)
      normalizeRule(run, chords, types, eventsToListen)
    })
  }

  return eventsToListen
}

export class Shortcuts {
  constructor(...args) {
    signature(this, args, DEFAULTS, normalizeRules)

    this.config = configure(this.options)

    this.config.agent ??= this.el
    this.config.thisArg ??= this.config.agent

    if (this.definitions) queueMicrotask(() => this.setRules(this.definitions))

    devices.listen()
  }

  findRule(e, rules) {
    let target

    // check rules in reverse order
    // so last declared rule has priority if "multiple" option is false
    for (let i = rules.length - 1; i >= 0; i--) {
      const rule = rules[i]
      if (rule.when?.(rule.options.agent) === false) continue

      if (e.repeat && rule.options.repeatable !== true) {
        if (rule.result === false || rule.options.preventDefault) {
          e.preventDefault()
        }

        continue
      }

      if (rule.options.selector) {
        target = e.target.closest(rule.options.selector)
        if (target === null) continue
      } else {
        target = e.target
      }

      const pass = rule.chords.every((chord) => {
        const { index, type, seq } = chord

        let inChord = false
        let chordComplete = true
        for (const key of seq[index]) {
          if (devices[type][key]) inChord = true
          else {
            chordComplete = false
            break
          }
        }

        if (inChord === false) chordComplete = false

        if (chordComplete) {
          if (index === seq.length - 1) {
            chord.index = 0
            return true // chord match and is the end of a sequence
          }

          chord.index++
          return false // chord match but is not the end of a sequence
        }

        if (inChord === false) chord.index = 0

        return false // chord don't match
      })

      if (pass) {
        rule.result = rule.options.serializeArgs
          ? rule.run(...serializeArgs(e, target, rule.options.args))
          : rule.run(e, target)

        if (rule.result === false || rule.options.preventDefault) {
          e.preventDefault()
        }

        if (!rule.options.propagate) e.stopPropagation()

        if (rule.options.multiple !== true) {
          // reset sequences that don't begin with the same chords as current rule
          for (const otherRule of rules) {
            for (let i = 0; i < otherRule.chords.length; i++) {
              const otherChord = otherRule.chords[i]
              let sameBegin = false
              if (rule.chords[i]) {
                const chord = rule.chords[i]
                sameBegin = chord.seq.every(
                  (seq, j) =>
                    otherChord.seq[j] &&
                    seq.every((key, k) => key === otherChord.seq[j][k])
                )
              }

              if (sameBegin === false) otherChord.index = 0
            }
          }

          break
        }
      }
    }
  }

  setRules(rules) {
    if (this.forget) this.forget()
    this.rules = rules
    const listeners = Object.create(null)

    for (const [event, rules] of Object.entries(this.rules)) {
      rules.forEach((rule) => this.setRuleContext(rule))
      listeners[event] = {
        options: {
          passive: this.config.preventDefault
            ? false
            : this.config.passive === undefined
            ? event !== "keydown"
            : this.config.passive,
        },
        listener: (e) => {
          this.findRule(e, rules)
        },
      }
    }

    const options = { signal: this.config.signal }

    this.forget = this.selector
      ? listen(this.el, this.selector, options, listeners)
      : listen(this.el, options, listeners)

    return this
  }

  setRuleContext(rule) {
    rule.options = { ...this.config, ...rule.options }

    if (typeof rule.options.when === "string") {
      rule.when = expr.evaluate(rule.options.when, { boolean: true })
    }

    rule.options.args = arrify(rule.options.args)
    const args = rule.options.serializeArgs ? [] : rule.options.args

    const type = typeof rule.run

    if (type === "string") {
      const parentMethod = getParentMethod(this.el, rule.run)
      // console.log(rule.run, parentMethod)
      if (parentMethod) {
        rule.run = parentMethod
        return
      }

      const fn =
        "get" in rule.options.agent
          ? rule.options.agent.get(rule.run)
          : locate(rule.options.agent, rule.run)

      if (fn) {
        rule.run = fn.bind(rule.options.thisArg, ...args)
        return
      }
    }

    if (type === "function") {
      rule.run = rule.run.bind(rule.options.thisArg, ...args)
      return
    }

    throw new Error(`Missing run function: ${rule.run}`)
  }

  destroy(deep) {
    if (this.forget) this.forget()
    if (deep) {
      devices.forget()
    }
  }
}

export default function shortcuts(...args) {
  return new Shortcuts(...args)
}

Object.assign(shortcuts, devices)
