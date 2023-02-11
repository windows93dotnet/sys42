import normalizeFilename from "./fs/normalizeFilename.js"
import getDriverLazy from "./fs/getDriverLazy.js"
import removeItem from "../fabric/type/array/removeItem.js"
import resolvePath from "./path/core/resolvePath.js"
import defer from "../fabric/type/promise/defer.js"
import inTop from "./env/realm/inTop.js"
import ipc from "./ipc.js"

const DEFAULTS = {
  places: { "/": "indexeddb" },
  // places: { "/": "localstorage" },
  // places: { "/": "memory" },
}

// TODO: https://web.dev/storage-foundation/
// TODO: https://web.dev/file-system-access/
// TODO: https://emscripten.org/docs/api_reference/Filesystem-API.html#id2

if (inTop) {
  ipc.on("IPCDriver", async ({ type, args }) => fs[type](...args))
}

const UTF8 = "utf-8"

let places

const queue = new Map()

async function enqueue(filename) {
  const deferred = defer()

  deferred.promise.finally(() => {
    const stack = queue.get(filename)
    removeItem(stack, deferred)
    if (stack.length === 0) queue.delete(filename)
  })

  if (queue.has(filename)) {
    const stack = queue.get(filename)
    const previous = stack.pop()
    stack.push(deferred)
    queue.set(filename, stack)
    await previous
  } else {
    queue.set(filename, [deferred])
  }

  return deferred.resolve
}

function mountPlace(place, driverName, options = {}) {
  driverName = driverName.toLowerCase()
  if (!place.startsWith("/")) place = `/${place}`
  if (!place.endsWith("/")) place = `${place}/`
  if (options.force || place in fs.config.places === false) {
    fs.config.places[place] = driverName
  } else {
    throw new Error(
      `'${place}' is already mounted with '${fs.config.places[place]}'`
    )
  }
}

export function mount(place, driverName, options) {
  const type = typeof place
  if (type === "object") {
    options = driverName
    for (const [key, val] of Object.entries(place)) {
      mountPlace(key, val, options)
    }
  } else if (type === "string") {
    mountPlace(place, driverName, options)
  }

  places = Object.keys(fs.config.places).sort((a, b) => b.length - a.length)
}

async function findDriver(path) {
  const filename = normalizeFilename(path)

  let name
  if (inTop) {
    const place = places.find((item) => filename.startsWith(item))
    if (place in fs.config.places === false) {
      throw new Error(`no driver mounted for '${filename}'`)
    }

    name = fs.config.places[place]
  } else {
    name = "ipc"
  }

  const driver = await getDriverLazy(name)
  return { filename, driver }
}

/* check
======== */

export async function access(path, ...args) {
  const { driver, filename } = await findDriver(path)
  return driver.access(filename, ...args)
}

export async function getURL(path, ...args) {
  const { driver, filename } = await findDriver(path)
  return driver.getURL(filename, ...args)
}

export async function isFile(path, ...args) {
  const { driver, filename } = await findDriver(path)
  return driver.isFile(filename, ...args)
}

export async function isDir(path, ...args) {
  const { driver, filename } = await findDriver(path)
  return driver.isDir(filename, ...args)
}

export async function isLink(path, ...args) {
  const { driver, filename } = await findDriver(path)
  return driver.isLink(filename, ...args)
}

export async function link(path, ...args) {
  const { driver, filename } = await findDriver(path)
  await driver.link(filename, ...args)
}

/* file
======= */

export async function open(path, ...args) {
  const { driver, filename } = await findDriver(path)
  return driver.open(filename, ...args)
}

export async function read(path, ...args) {
  const { driver, filename } = await findDriver(path)
  return driver.read(filename, ...args)
}

export async function write(path, ...args) {
  const { driver, filename } = await findDriver(path)
  const resolve = await enqueue(path)
  await driver.write(filename, ...args).finally(resolve)
}

export async function append(path, ...args) {
  const { driver, filename } = await findDriver(path)
  const resolve = await enqueue(path)
  await driver.append(filename, ...args).finally(resolve)
}

export async function deleteFile(path, ...args) {
  const { driver, filename } = await findDriver(path)
  await driver.delete(filename, ...args)
}

/* dir
====== */

export async function writeDir(path) {
  const { driver, filename } = await findDriver(path)
  await driver.writeDir(filename)
}

export async function readDir(path, ...args) {
  const { driver, filename } = await findDriver(path)
  return driver.readDir(filename, ...args)
}

export async function deleteDir(path) {
  const { driver, filename } = await findDriver(path)
  await driver.deleteDir(filename)
}

/* stream
========= */

export function sink(path, options) {
  let underlyingSink

  return new WritableStream(
    {
      async write(chunk) {
        if (!underlyingSink) {
          const { driver, filename } = await findDriver(path)
          underlyingSink = await driver.sink(filename, options)
        }

        await underlyingSink.write(chunk)
      },
      async close() {
        await underlyingSink?.close()
      },
      async abort() {
        await underlyingSink?.close()
      },
    },
    options?.queuingStrategy
  )
}

export function source(path, options) {
  let iterator
  let emptyQueue = true

  return new ReadableStream(
    {
      async pull(controller) {
        if (!iterator) {
          const { driver, filename } = await findDriver(path)
          try {
            iterator = await driver.source(filename, options)
          } catch (err) {
            controller.error(err)
            return
          }
        }

        const { value, done } = await iterator.next()
        if (done) {
          if (emptyQueue) controller.enqueue()
          controller.close()
        } else {
          emptyQueue = false
          controller.enqueue(value)
        }
      },
    },
    options?.queuingStrategy
  )
}

export async function copy(from, to, options) {
  from = resolvePath(from)
  to = resolvePath(to)

  if (await isDir(from)) {
    const undones = []
    const files = await readDir(from, { recursive: true })
    for (const path of files) {
      undones.push(move(`${from}/${path}`, `${to}/${path}`, options))
    }

    await Promise.all(undones)
    if (options?.delete) await deleteDir(from)
    return
  }

  let rs = source(from, options)
  if (options?.progress) rs = rs.pipeThrough(options?.progress())
  await rs.pipeTo(sink(to, options))

  if (options?.delete) await deleteFile(from)
}

export async function move(from, to, options) {
  from = resolvePath(from)
  to = resolvePath(to)

  if (to.startsWith(from)) {
    if (to === from) return
    throw new Error("A folder cannot be moved into itself")
  }

  return copy(from, to, { ...options, delete: true })
}

/* sugar
======== */

export async function writeText(path, value) {
  return write(path, value, UTF8)
}

export async function readText(path) {
  return read(path, UTF8)
}

export async function writeJSON(path, value, replacer, space = 2) {
  return write(path, JSON.stringify(value, replacer, space) ?? "", UTF8) //
}

export async function readJSON(path, options) {
  if (options?.strict) {
    return read(path, UTF8).then((value) => JSON.parse(value))
  }

  const JSON5 = await import("./formats/json5.js").then((m) => m.default)
  return read(path, UTF8).then((value) => JSON5.parse(value))
}

export async function writeJSON5(path, value, replacer, space = 2) {
  let previous

  if (value === undefined) {
    return write(path, "", UTF8)
  }

  try {
    previous = await read(path, UTF8)
  } catch {}

  if (previous) {
    const JSON5 = await import("./formats/json5.js").then((m) => m.default)
    try {
      return write(path, JSON5.format(previous, value), UTF8)
    } catch {}
  }

  return write(path, JSON.stringify(value, replacer, space), UTF8)
}

export async function writeCBOR(path, value) {
  // @read https://github.com/cbor-wg/cbor-magic-number
  const CBOR = await import("./formats/cbor.js").then((m) => m.default)
  return write(path, CBOR.encode(value))
}

export async function readCBOR(path) {
  const CBOR = await import("./formats/cbor.js").then((m) => m.default)
  return read(path).then((value) => CBOR.decode(value))
}

export const fs = {
  mount,
  config: structuredClone(DEFAULTS),

  access,
  getURL,
  isDir,
  isFile,
  isLink,
  link,

  open,
  read,
  write,
  append,
  delete: deleteFile,

  writeDir,
  readDir,
  deleteDir,

  sink,
  source,
  copy,
  move,

  writeText,
  readText,
  writeJSON,
  writeJSON5,
  readJSON,
  readJSON5: readJSON,
  writeCBOR,
  readCBOR,
}

// aliases

fs.write.text = writeText
fs.read.text = readText

fs.write.json = writeJSON
fs.read.json = readJSON
fs.write.json5 = writeJSON5
fs.read.json5 = readJSON

fs.write.cbor = writeCBOR
fs.read.cbor = readCBOR

fs.write.dir = writeDir
fs.read.dir = readDir
fs.delete.dir = deleteDir

mount()

export default fs
