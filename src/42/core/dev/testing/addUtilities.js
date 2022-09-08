import allKeys from "../../../fabric/type/object/allKeys.js"
import arrify from "../../../fabric/type/any/arrify.js"
import clone from "../../../fabric/type/any/clone.js"
import defer from "../../../fabric/type/promise/defer.js"
import documentReady from "../../../fabric/dom/documentReady.js"
import DOMQuery from "../../../fabric/class/DOMQuery.js"
import env from "../../env.js"
import hashmap from "../../../fabric/type/object/hashmap.js"
import http from "../../../core/http.js"
import idle from "../../../fabric/type/promise/idle.js"
import kill from "../../../fabric/type/any/kill.js"
import listenFn from "../../../fabric/event/listen.js"
import log, { Log, CONSOLE_KEYS } from "../../log.js"
import noop from "../../../fabric/type/function/noop.js"
import parallel from "../../../fabric/type/promise/parallel.js"
import prettify from "../../../fabric/type/markup/prettify.js"
import puppet from "../puppet.js"
import repaint from "../../../fabric/type/promise/repaint.js"
import serial from "../../../fabric/type/promise/serial.js"
import shell from "../../shell.js"
import sleep from "../../../fabric/type/promise/sleep.js"
import stream from "../../stream.js"
import stringify from "../../../fabric/type/any/stringify.js"
import system from "../../../system.js"
import uid from "../../uid.js"
import when from "../../../fabric/type/promise/when.js"
import pick from "../../../fabric/type/object/pick.js"
import omit from "../../../fabric/type/object/omit.js"

function pickValues(btn, key = "textContent") {
  const out = {}
  for (const [k, val] of Object.entries(btn)) out[k] = val[key]
  return out
}

const idRegistry = {}
const _forgets = Symbol("_forgets")
const _decays = Symbol("_decays")

export default function addUtilities(item, isExecutionContext) {
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
          if (isExecutionContext) item.timeout("reset")
          item.logs.push([new Error(), type, args])
        },
      ])
    )

    item.puppet = (el) => {
      const instance = puppet(el)
      item.teardown(() => instance.cleanup())
      return instance
    }

    item.utils = {}

    item.utils[_forgets] = []
    item.utils.listen = (...args) => {
      if (item.utils[_forgets].length === 0) {
        item.teardown(() => {
          for (const forget of item.utils[_forgets]) forget()
          item.utils[_forgets].length = 0
        })
      }

      item.utils[_forgets].push(listenFn(...args))
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

    item.utils.dest = (connect, options) => {
      const el = document.createElement("section")
      const { suiteTitle } = item.utils
      idRegistry[suiteTitle] ??= 0
      el.id = suiteTitle + "/" + idRegistry[suiteTitle]++
      el.style.cssText = `
        position: absolute;
        overflow: auto;
        margin: 0;
        inset: 0;`

      if (options?.keep !== true) {
        // Use queueMicrotask to register all manual decays before
        // e.g.
        // In this situation: t.utils.decay(ui(dest() … ))
        // the ui function should be killed before it's destination element is removed
        queueMicrotask(() => decay(el))
        el.style.opacity = 0.01
      }

      if (connect) document.body.append(el)
      return el
    }
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
          if (cb.length > 1) {
            let fn = data.only ? item.only : data.skip ? item.skip : item
            if (data.failing) fn = fn.failing
            if (data.flaky) fn = fn.flaky
            cb(fn, data, i)
          } else cb(data, i)
        })
      }

      return list
    }

    item.task = (obj) => {
      obj.taskError = new Error()
      return obj
    }
  }

  item.utils ??= {}

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
    log,
    noop,
    parallel,
    prettify,
    puppet,
    repaint,
    serial,
    shell,
    sleep,
    stream,
    stringify,
    system,
    uid,
    when,
    omit,
    pick,
    pickValues,
    $: new DOMQuery(),
  })

  item._ = item.utils
}
