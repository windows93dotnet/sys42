import allKeys from "../../../fabric/type/object/allKeys.js"
import arrify from "../../../fabric/type/any/arrify.js"
import clone from "../../../fabric/type/any/clone.js"
import documentReady from "../../../fabric/dom/documentReady.js"
import DOMQuery from "../../../fabric/class/DOMQuery.js"
import env from "../../env.js"
import hashmap from "../../../fabric/type/object/hashmap.js"
import http from "../../../core/http.js"
import idle from "../../../fabric/type/promise/idle.js"
import listen from "../../../fabric/dom/listen.js"
import log, { Log, CONSOLE_KEYS } from "../../log.js"
import noop from "../../../fabric/type/function/noop.js"
import parallel from "../../../fabric/type/promise/parallel.js"
import prettify from "../../../fabric/type/markup/prettify.js"
import repaint from "../../../fabric/type/promise/repaint.js"
import serial from "../../../fabric/type/promise/serial.js"
import shell from "../../shell.js"
import sleep from "../../../fabric/type/promise/sleep.js"
import stream from "../../stream.js"
import stringify from "../../../fabric/type/any/stringify.js"
import system from "../../../system.js"
import uid from "../../uid.js"
import when from "../../../fabric/type/promise/when.js"

const tasks = (list, cb, item) => {
  if (typeof cb === "function") {
    list.forEach((data, i) => {
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
  } else {
    item.if = (condition) => (condition ? item : noop)
    item.skipIf = (condition) => (condition ? item.skip : item)
    item.onlyIf = (condition) => (condition ? item.only : item)
    item.sleep = sleep
    item.env = env
    item.tasks = (list, cb) => tasks(list, cb, item)
    item.task = (obj) => {
      obj.taskError = new Error()
      return obj
    }
  }

  function container(options = {}, cb) {
    const elements = []

    item.teardown(() => {
      cb?.(elements)
      for (const el of elements) el.remove()
      elements.length = 0
    })

    return function (connect = options.connect) {
      const el = document.createElement(options.tag ?? "section")
      if (options.visible !== true) el.style.opacity = 0.01
      if (options.id) el.id = options.id
      if (options.keep !== true) elements.push(el)
      if (connect) document.body.append(el)
      return el
    }
  }

  item.utils = {
    allKeys,
    arrify,
    clone,
    container,
    documentReady,
    hashmap,
    http,
    idle,
    listen,
    log,
    noop,
    parallel,
    prettify,
    repaint,
    serial,
    shell,
    sleep,
    stream,
    stringify,
    system,
    uid,
    when,
    $: new DOMQuery(),
  }
}
