#! /usr/bin/env node

import { spawn } from "node:child_process"

let child

const args = [
  // "--no-warnings",
  // "--harmony",
  // "--stack-size=1024",
  // "--stack_trace_limit=1000",
  new URL("./backend.js", import.meta.url).pathname,
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
