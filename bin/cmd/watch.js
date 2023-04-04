import path from "node:path"
import chokidar from "chokidar"

import system from "../../src/42/system.js"
import { format } from "../../src/42/core/log.js"
import debounce from "../../src/42/fabric/type/function/debounce.js"
import graph from "../utils/graph.js"
import lookupTestfiles from "../utils/graph/lookupTestfiles.js"

const task = system.config.tasks.watch

task.graph = system.config.run.includes("test") ? task.graph : false

const dirBin = system.config.paths.dirs.bin
const dirLib = system.config.paths.dirs.lib

const { cwd, src } = system.config.paths.dirs
const { host } = system.config.paths

const formatFileConfig = {
  shorten: false,
  colors: { dir: "blueBright", name: "blueBright.dim" },
}

const ignored = new Set()
system.on("watch:ignore", (x) => ignored.add(x))

let graphResult
// TODO: make graph in worker
function makeGraphResult() {
  graph(task.graph.glob, { cwd, host }).then((x) => {
    graphResult = x
    if (task.verbose < 3) return
    task
      .log(" graph globs")
      .hr()
      .log(
        format
          .entries(x.globs, {
            keyFormater: (x) => format.file(x, formatFileConfig),
            valueFormater: (x) =>
              [...x].map((x) => format.file(`${cwd}${x}`)).join(", "),
          })
          .trim()
      )
      .hr()
  })
}

// TODO: improve kit regeneration for performance
let remakeBusy
const remakeKit = debounce(async () => {
  await remakeBusy
  remakeBusy = system.tasks.kit()
}, 500)

async function refresh(event, filename) {
  if (ignored.has(filename)) return

  task.log(` ${event.padEnd(7)} ${format.file(filename)}`)

  if (event !== "change") {
    const undones = []
    if (task.graph) undones.push(makeGraphResult())
    // TODO: fix scan + watch
    if (system.config.run.includes("scan")) undones.push(system.tasks.scan())
    await Promise.all(undones)
  }

  if (
    filename === system.config.paths.files.config ||
    (system.config.dev &&
      filename.endsWith(".js") &&
      (filename.startsWith(dirBin) || filename.startsWith(dirLib)))
  ) {
    system.emit("backend:restart")
  } else {
    const relative = filename.replace(cwd, "")
    const url = filename.replace(src, "").replaceAll("\\", "/")

    if (task.graph) {
      if (graphResult) {
        const testFiles = lookupTestfiles(graphResult, relative)
        if (testFiles.length > 0) system.emit("test:change", testFiles)
      }
    } else system.emit("test:change")

    system.emit("watch:change", url, relative, filename)
  }

  if (system.config.run.includes("kit")) remakeKit()
}

refresh.change = debounce(refresh, 250, true)
refresh.other = debounce(refresh, 250, false)

const doubleSave = new Set()

export default async function watch() {
  const glob = system.config.dev ? [...task.globDev] : [...task.glob]

  if (system.config.paths.files.config) {
    glob.push(system.config.paths.files.config)
  }

  if (task.graph) makeGraphResult()

  chokidar
    .watch(glob, {
      cwd,
      ignored: [
        // TODO: add gitignore files
        "node_modules",
        ".git",
        system.config.paths.files.scan,
        system.config.paths.dirs.dist,
        system.config.paths.dirs.tmp,
        system.config.paths.dirs.kits,
      ],
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 32,
        pollInterval: 8,
      },
    })
    .on("all", (event, filename) => {
      if (event === "addDir") return
      filename = path.join(cwd, filename)

      if (doubleSave.has(filename)) {
        system.emit("watch:reload")
        doubleSave.clear()
      } else {
        doubleSave.add(filename)
        setTimeout(() => doubleSave.delete(filename), 1000)
      }

      refresh[event === "change" ? "change" : "other"](event, filename)
    })
}
