import inOpaqueOrigin from "./env/realm/inOpaqueOrigin.js"
import inTop from "./env/realm/inTop.js"
import configure from "./configure.js"
import resolvePath from "../core/path/core/resolvePath.js"
import FileSystemError from "./fs/FileSystemError.js"
import addStack from "../fabric/type/error/addStack.js"
import getDriverLazy from "./fs/getDriverLazy.js"
import ipc from "./ipc.js"

export { default as FileError } from "./fs/FileSystemError.js"

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

export function fsMount(place, driverName, options) {
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

export async function fsAccess(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.access(filename)
}

export async function fsIsFile(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.isFile(filename)
}

export async function fsIsDir(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.isDir(filename)
}

/* file
======= */

export async function fsOpen(path, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  if (typeof options === "string") options = { encoding: options }
  return driver.open(filename, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function fsRead(path, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  if (typeof options === "string") options = { encoding: options }
  return driver.read(filename, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function fsWrite(path, value, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  if (typeof options === "string") options = { encoding: options }
  return driver.write(filename, value, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function fsDelete(path, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.delete(filename, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function fsAppend(path, value, options = {}) {
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

export async function fsWriteDir(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.writeDir(filename).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function fsReadDir(path, options = {}) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.readDir(filename, options).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

export async function fsDeleteDir(path) {
  const { stack } = new Error()
  const { driver, filename } = await findDriver(path, stack)
  return driver.deleteDir(filename).catch((err) => {
    if ("errno" in err === false) throw err
    throw new FileSystemError(err.errno, filename, stack)
  })
}

/* stream
========= */

export function fsSink(path, options = {}) {
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

export function fsSource(path, options = {}) {
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

export async function fsCopy(from, to, options) {
  from = resolvePath(from)
  to = resolvePath(to)

  if (await fsIsDir(from)) {
    const undones = []
    const files = await fsReadDir(from, { recursive: true })
    for (const path of files) {
      undones.push(fsMove(`${from}/${path}`, `${to}/${path}`))
    }

    await Promise.all(undones)
    if (options?.delete) await fsDeleteDir(from)
    return
  }

  let source = fsSource(from, options)
  if (options?.progress) source = source.pipeThrough(options?.progress())
  await source.pipeTo(fsSink(to, options))

  if (options?.delete) await fsDelete(from)
}

export async function fsMove(from, to, options) {
  return fsCopy(from, to, { ...options, delete: true })
}

/* sugar
======== */

export async function fsWriteText(path, value) {
  await fsWrite(path, value, UTF8)
}

export async function fsReadText(path) {
  return fsRead(path, UTF8)
}

export async function fsWriteJSON(path, value, replacer, space = 2) {
  let previous

  if (value === undefined) {
    await fsWrite(path, "", UTF8)
    return
  }

  try {
    previous = await fsRead(path, UTF8)
  } catch {}

  if (previous) {
    const JSON5 = await import("./formats/json5.js").then((m) => m.default)
    try {
      await fsWrite(path, JSON5.format(previous, value), UTF8)
      return
    } catch {}
  }

  await fsWrite(path, JSON.stringify(value, replacer, space), UTF8)
}

export async function fsReadJSON(path) {
  const JSON5 = await import("./formats/json5.js").then((m) => m.default)
  return fsRead(path, UTF8).then((value) => JSON5.parse(value))
}

export async function fsWriteCBOR(path, value) {
  // @read https://github.com/cbor-wg/cbor-magic-number
  const CBOR = await import("./formats/cbor.js").then((m) => m.default)
  await fsWrite(path, CBOR.encode(value))
}

export async function fsReadCBOR(path) {
  const CBOR = await import("./formats/cbor.js").then((m) => m.default)
  return fsRead(path).then((value) => CBOR.decode(value))
}

const fs = {
  FileSystemError,
  config: configure(DEFAULTS),
  mount: fsMount,

  access: fsAccess,
  isDir: fsIsDir,
  isFile: fsIsFile,

  open: fsOpen,
  read: fsRead,
  write: fsWrite,
  delete: fsDelete,
  append: fsAppend,

  writeDir: fsWriteDir,
  readDir: fsReadDir,
  deleteDir: fsDeleteDir,

  sink: fsSink,
  source: fsSource,
  copy: fsCopy,
  move: fsMove,

  writeText: fsWriteText,
  readText: fsReadText,
  writeJSON: fsWriteJSON,
  readJSON: fsReadJSON,
  writeCBOR: fsWriteCBOR,
  readCBOR: fsReadCBOR,
}

// aliases

fs.write.text = fsWriteText
fs.read.text = fsReadText

fs.write.json = fsWriteJSON
fs.read.json = fsReadJSON
fs.write.json5 = fsWriteJSON
fs.read.json5 = fsReadJSON

fs.write.cbor = fsWriteCBOR
fs.read.cbor = fsReadCBOR

fs.write.dir = fsWriteDir
fs.read.dir = fsReadDir
fs.delete.dir = fsDeleteDir

fsMount()

export default fs
