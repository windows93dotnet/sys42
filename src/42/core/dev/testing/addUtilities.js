import allKeys from "../../../fabric/type/object/allKeys.js"
import arrify from "../../../fabric/type/any/arrify.js"
import clone from "../../../fabric/type/any/clone.js"
import create from "../../../ui/create.js"
import defer from "../../../fabric/type/promise/defer.js"
import documentReady from "../../../fabric/dom/documentReady.js"
import env from "../../env.js"
import hashmap from "../../../fabric/type/object/hashmap.js"
import http from "../../../core/http.js"
import idle from "../../../fabric/type/promise/idle.js"
import kill from "../../../fabric/type/any/kill.js"
import load from "../../load.js"
import log, { Log, CONSOLE_KEYS } from "../../log.js"
import nextCycle from "../../../fabric/type/promise/nextCycle.js"
import nextRepaint from "../../../fabric/type/promise/nextRepaint.js"
import noop from "../../../fabric/type/function/noop.js"
import omit from "../../../fabric/type/object/omit.js"
import on from "../../../fabric/event/on.js"
import parallel from "../../../fabric/type/promise/parallel.js"
import pick from "../../../fabric/type/object/pick.js"
import preload from "../../load/preload.js"
import prettify from "../../formats/markup/prettify.js"
import puppet from "../puppet.js"
import queueTask from "../../../fabric/type/function/queueTask.js"
import repaint from "../../../fabric/type/promise/repaint.js"
import serial from "../../../fabric/type/promise/serial.js"
import shell from "../../shell.js"
import sleep from "../../../fabric/type/promise/sleep.js"
import stream from "../../stream.js"
import stringify from "../../../fabric/type/any/stringify.js"
import system from "../../../system.js"
import uid from "../../uid.js"
import when from "../../../fabric/type/promise/when.js"

function pickValues(obj, key = "textContent") {
  const out = {}
  for (const [k, val] of Object.entries(obj)) out[k] = val[key]
  return out
}

const idRegistry = {}
const _forgets = Symbol("_forgets")
const _decays = Symbol("_decays")

export default function addUtilities(item, options) {
  const isExecutionContext = options?.isExecutionContext

  if (isExecutionContext) {
    item.logs = []
    item.log = new Log({
      context: {
        config: {
          error: {
            colors: {
              message: "blue",
              function: "blue.dim",
            },
            filename: {
              colors: { line: "blue" },
            },
            entries: {
              colors: { key: `blue.dim` },
            },
          },
          stringify: "inspect",
        },
      },
    })

    item.log.console = Object.fromEntries(
      CONSOLE_KEYS.map((type) => [
        type,
        (...args) => {
          item.timeout("reset")
          item.logs.push([new Error(), type, args])
        },
      ]),
    )

    Object.defineProperty(item, "puppet", {
      get() {
        const instance = puppet.makePuppet()
        item.teardown(() => instance.cleanup())
        return instance
      },
    })
  } else {
    item.if = (condition) => (condition ? item : noop)
    item.skipIf = (condition) => (condition ? item.skip : item)
    item.onlyIf = (condition) => (condition ? item.only : item)
    item.sleep = sleep
    item.env = env

    item.tasks = (list, cb) => {
      if (typeof cb === "function") {
        list.forEach((data, i) => {
          if (!data) return
          if (data.taskError) item = item.taskError(data.taskError)

          let fn = data.only ? item.only : data.skip ? item.skip : item
          if (data.failing) fn = fn.failing
          if (data.flaky) fn = fn.flaky
          cb(fn, data, i)
        })
      }

      return list
    }

    item.task = (obj) => {
      obj.taskError = new Error()
      return obj
    }
  }

  item.PLACEHOLDER = Symbol.for("Assert.PLACEHOLDER")

  item.utils ??= {}

  item.utils[_forgets] = []
  item.utils.on = (...args) => {
    if (item.utils[_forgets].length === 0) {
      item.teardown(() => {
        for (const forget of item.utils[_forgets]) forget()
        item.utils[_forgets].length = 0
      })
    }

    item.utils[_forgets].push(on(...args))
  }

  item.utils[_decays] = []
  const decay = (thing, cb) => {
    if (item.utils[_decays].length === 0) {
      item.teardown(async () => {
        for (const obj of item.utils[_decays]) {
          if (cb?.(obj) === false) continue
          if ((await kill(obj, console.warn)) === false) {
            console.warn("decay object wasn't killed", obj)
          }
        }

        item.utils[_decays].length = 0
      })
    }

    item.utils[_decays].push(thing)

    return thing
  }

  item.utils.decay = decay

  item.utils.invisible = (el) => {
    el.style = `
      position: absolute;
      overflow: auto;
      margin: 0;
      inset: 0;
      opacity: 0.001;`
    return el
  }

  item.utils.dest = (options) => {
    const el = create(
      options?.tag ?? "section",
      options ? omit(options, ["tag", "keep", "connect"]) : undefined,
    )
    const suiteTitle = item.suite.title
    idRegistry[suiteTitle] ??= 0
    el.id ||= suiteTitle + "/" + idRegistry[suiteTitle]++
    el.style = `
      position: absolute;
      overflow: auto;
      margin: 0;
      inset: 0;`

    if (options?.keep !== true) {
      if (isExecutionContext) {
        // Use queueMicrotask to remove all manual decays first
        // e.g.
        // In this situation: t.utils.decay(ui(t.utils.dest() … ))
        // the ui function should be killed before it's destination element is removed
        queueMicrotask(() => decay(el))
      } else {
        decay(el)
      }

      el.style.opacity = 0.001
      el.style.pointerEvents = "none"
    }

    if (options?.connect) document.body.append(el)
    return el
  }

  Object.assign(item.utils, {
    allKeys,
    arrify,
    clone,
    defer,
    documentReady,
    hashmap,
    http,
    idle,
    kill,
    load,
    log,
    nextCycle,
    nextRepaint,
    noop,
    omit,
    parallel,
    pick,
    pickValues,
    preload,
    prettify,
    puppet,
    queueTask,
    repaint,
    serial,
    shell,
    sleep,
    stream,
    stringify,
    system,
    uid,
    when,
  })
}
