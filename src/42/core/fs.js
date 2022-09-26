import inOpaqueOrigin from "./env/realm/inOpaqueOrigin.js"
import inTop from "./env/realm/inTop.js"
import configure from "./configure.js"
import resolvePath from "../core/path/core/resolvePath.js"
import FileSystemError from "./fs/FileSystemError.js"
import addStack from "../fabric/type/error/addStack.js"
import getDriverLazy from "./fs/getDriverLazy.js"
import ipc from "./ipc.js"

export { default as FileSystemError } from "./fs/FileSystemError.js"

const UTF8 = "utf-8"

const DEFAULTS = {
  places: { "/": "indexeddb" },
}

// "/var/": "localstorage",
// "/tmp/": "memory",
// "/www/": "cache",
// TODO: https://web.dev/storage-foundation/
// TODO: https://web.dev/file-system-access/
// TODO: https://emscripten.org/docs/api_reference/Filesystem-API.html#id2

let places

if (inTop) ipc.on("IPCDriver", async ({ type, args }) => fs[type](...args))

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

async function findDriver(path, stack) {
  const filename = resolvePath(path)
  let name
  if (inOpaqueOrigin) {
    name = "ipc"
  } else {
    const place = places.find((item) => filename.startsWith(item))
    if (place in fs.config.places === false) {
      throw addStack(new Error(`no driver mounted for '${filename}'`), stack)
    }

    name = fs.config.places[place]
  }

  const driver = await getDriverLazy(name, stack)
  return { filename, driver }
}

/* check
======== */

export async function access(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.access(filename)
}

export async function isFile(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.isFile(filename)
}

export async function isDir(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.isDir(filename)
}

/* file
======= */

export async function open(path, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  if (typeof options === "string") options = { encoding: options }
  return driver.open(filename, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function read(path, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  if (typeof options === "string") options = { encoding: options }
  return driver.read(filename, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function write(path, value, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  if (typeof options === "string") options = { encoding: options }
  return driver.write(filename, value, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function deleteFile(path, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.delete(filename, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function append(path, value, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  if (typeof options === "string") options = { encoding: options }
  return driver.append(filename, value, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

/* dir
====== */

export async function writeDir(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.writeDir(filename).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function readDir(path, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.readDir(filename, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function deleteDir(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.deleteDir(filename).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

/* stream
========= */

export function sink(path, options = {}) {
  const { stack } = new Error()

  let underlyingSink
  if (typeof options === "string") options = { encoding: options }

  return new WritableStream(
    {
      async write(chunk) {
        if (!underlyingSink) {
          const { driver, filename } = await findDriver(path, stack)
          try {
            underlyingSink = await driver.sink(filename, options)
          } catch (err) {
            if ("errno" in err === false) throw err
            throw new FileSystemError(err.errno, filename, stack)
          }
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
    options.queuingStrategy
  )
}

export function source(path, options = {}) {
  const { stack } = new Error()

  let iterator
  if (typeof options === "string") options = { encoding: options }

  return new ReadableStream(
    {
      async pull(controller) {
        if (!iterator) {
          const { driver, filename } = await findDriver(path, stack)
          try {
            iterator = await driver.source(filename, options)
          } catch (err) {
            controller.error(
              "errno" in err === false
                ? err
                : new FileSystemError(err.errno, filename, stack)
            )
            return
          }
        }

        const { value, done } = await iterator.next()
        if (done) controller.close()
        else controller.enqueue(value)
      },
    },
    options.queuingStrategy
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
  return copy(from, to, { ...options, delete: true })
}

/* sugar
======== */

export async function writeText(path, value) {
  await write(path, value, UTF8)
}

export async function readText(path) {
  return read(path, UTF8)
}

export async function writeJSON(path, value, replacer, space = 2) {
  let previous

  if (value === undefined) {
    return void (await write(path, "", UTF8))
  }

  try {
    previous = await read(path, UTF8)
  } catch {}

  if (previous) {
    const JSON5 = await import("./formats/json5.js").then((m) => m.default)
    try {
      return void (await write(path, JSON5.format(previous, value), UTF8))
    } catch {}
  }

  await write(path, JSON.stringify(value, replacer, space), UTF8)
}

export async function readJSON(path) {
  const JSON5 = await import("./formats/json5.js").then((m) => m.default)
  return read(path, UTF8).then((value) => JSON5.parse(value))
}

export async function writeCBOR(path, value) {
  // @read https://github.com/cbor-wg/cbor-magic-number
  const CBOR = await import("./formats/cbor.js").then((m) => m.default)
  await write(path, CBOR.encode(value))
}

export async function readCBOR(path) {
  const CBOR = await import("./formats/cbor.js").then((m) => m.default)
  return read(path).then((value) => CBOR.decode(value))
}

const fs = {
  FileSystemError,
  config: configure(DEFAULTS),
  mount,

  access,
  isDir,
  isFile,

  open,
  read,
  write,
  delete: deleteFile,
  deleteFile,
  append,

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
  readJSON,
  writeCBOR,
  readCBOR,
}

// aliases

fs.write.text = writeText
fs.read.text = readText

fs.write.json = writeJSON
fs.read.json = readJSON
fs.write.json5 = writeJSON
fs.read.json5 = readJSON

fs.write.cbor = writeCBOR
fs.read.cbor = readCBOR

fs.write.dir = writeDir
fs.read.dir = readDir
fs.delete.dir = deleteDir

mount()

export default fs
