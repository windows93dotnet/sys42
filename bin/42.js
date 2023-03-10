#! /usr/bin/env node

import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

function resolve(path) {
  return fileURLToPath(new URL(path, import.meta.url))
}

let child

const args = [
  resolve("./backend.js", import.meta.url),
  ...process.argv.slice(2),
]

function restart() {
  if (child) {
    child.removeAllListeners()
    child.on("close", () => start(true))
    child.kill("SIGINT")
  } else {
    start(true)
  }
}

function start(isRestart) {
  child = spawn("node", isRestart ? [...args, "--no-greet"] : args, {
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  })

  child.on("message", (message) => {
    if (message === "restart") restart()
  })

  child.on("exit", (code) => process.exit(code))
}

start()
