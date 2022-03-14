import arrify from "../../../fabric/type/any/arrify.js"
import allKeys from "../../../fabric/type/object/allKeys.js"
// import asyncIteratorToArray from "../../type/stream/asyncIteratorToArray.js"
// import cast from "../../type/cast.js"
import clone from "../../../fabric/type/any/clone.js"
import hashmap from "../../../fabric/type/object/hashmap.js"
// import http from "../../http.js"
// import load from "../../load.js"
import noop from "../../../fabric/type/function/noop.js"
import parallel from "../../../fabric/type/promise/parallel.js"
// import path from "../../path.js"
import repaint from "../../../fabric/type/promise/repaint.js"
import serial from "../../../fabric/type/promise/serial.js"
// import shell from "../../system/shell.js"
import sleep from "../../../fabric/type/promise/sleep.js"
// import stream from "../../stream.js"
import stringify from "../../../fabric/type/any/stringify.js"
import system from "../../../system.js"
import uid from "../../../fabric/uid.js"

import log, { Log, CONSOLE_KEYS } from "../../../log.js"

import filterTasks from "../filterTasks.js"
import env from "../../env.js"

const tasks = (list, cb) => {
  list = filterTasks(list)
  if (typeof cb === "function") list.forEach(cb)
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
    item.tasks = (list, cb) => tasks(list, cb)
  }

  item.utils = {
    arrify,
    allKeys,
    // asyncIteratorToArray,
    // cast,
    clone,
    hashmap,
    // http,
    // load,
    log,
    noop,
    parallel,
    // path,
    repaint,
    serial,
    // shell,
    sleep,
    // stream,
    stringify,
    system,
    uid,
  }
}
