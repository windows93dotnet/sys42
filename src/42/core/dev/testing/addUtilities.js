import arrify from "../../../fabric/type/any/arrify.js"
import allKeys from "../../../fabric/type/object/allKeys.js"
import clone from "../../../fabric/type/any/clone.js"
import hashmap from "../../../fabric/type/object/hashmap.js"
import http from "../../../core/http.js"
import noop from "../../../fabric/type/function/noop.js"
import parallel from "../../../fabric/type/promise/parallel.js"
import repaint from "../../../fabric/type/promise/repaint.js"
import idle from "../../../fabric/type/promise/idle.js"
import serial from "../../../fabric/type/promise/serial.js"
import shell from "../../shell.js"
import sleep from "../../../fabric/type/promise/sleep.js"
import stream from "../../stream.js"
import stringify from "../../../fabric/type/any/stringify.js"
import system from "../../../system.js"
import uid from "../../uid.js"
import prettify from "../../../fabric/type/markup/prettify.js"
import DOMQuery from "../../../fabric/class/DOMQuery.js"
// import stackTrace from "../../../fabric/type/error/stackTrace.js"

import log, { Log, CONSOLE_KEYS } from "../../log.js"

import filterTasks from "../filterTasks.js"
import env from "../../env.js"

const tasks = (list, cb, item) => {
  list = filterTasks(list)
  if (typeof cb === "function") {
    list.forEach((data, i) => {
      if (data.taskError) item = item.taskError(data.taskError)
      if (cb.length > 1) cb(data.only ? item.only : item, data, i)
      else cb(data, i)
    })
  }

  return list
}

export default function addUtilities(item, isExecutionContext) {
  if (isExecutionContext) {
    item.logs = []
    item.log = new Log({ context: { config: { stringify: "inspect" } } })

    item.log.console = Object.fromEntries(
      CONSOLE_KEYS.map((type) => [
        type,
        (...args) => {
          if (isExecutionContext) item.timeout(false)
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
      if (options.id) el.id = options.id
      if (options.keep !== true) elements.push(el)
      if (connect) document.body.append(el)
      return el
    }
  }

  item.utils = {
    arrify,
    allKeys,
    clone,
    hashmap,
    http,
    log,
    noop,
    parallel,
    repaint,
    idle,
    serial,
    shell,
    sleep,
    stream,
    stringify,
    system,
    uid,
    prettify,
    container,
    $: new DOMQuery(),
  }
}
