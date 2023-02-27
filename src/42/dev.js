import inTop from "./core/env/realm/inTop.js"
import inAutomated from "./core/env/runtime/inAutomated.js"
import system from "./system.js"
import log from "./core/log.js"

import getScriptData from "./core/dev/getScriptData.js"
const { config = {} } = getScriptData(import.meta.url)

// config.verbose = 2
log.verbose = config.verbose

function greet() {
  log.if(config.verbose).cyanBright(`\
╷ ┌───┐
└─┤ ┌─┘  {reset type} {grey sys42.dev.help()} {reset for help}
  └─┴─╴`)
}

if (inTop && inAutomated) {
  if (config.testFiles) {
    const testRunner = await import("./core/dev/testRunner.js") //
      .then((m) => m.default)
    testRunner(config.testFiles, { ...config.testRunner, report: false })
  }
} else if (!inAutomated) {
  if (inTop || config.verbose > 2) greet()

  const liveReload = await import("./core/dev/liveReload.js") //
    .then((m) => m.default)
  const serverSentEvents = await import("./core/dev/serverSentEvents.js") //
    .then((m) => m.default)

  const dev = {
    loaded: false,
    sse: serverSentEvents("/42-dev"),
    help() {
      log(log.esc`\
{grey sys42.dev.test(options)} {grey.dim ..} run tests
{grey sys42.dev.clear(options)} {grey.dim .} clear site data
{grey sys42.dev.env(full)} {grey.dim ......} display env
{grey sys42.dev.pause()} {grey.dim ........} pause live-reload
{grey sys42.dev.resume()} {grey.dim .......} resume live-reload
{grey sys42.dev.toggle()} {grey.dim .......} toggle live-reload
{grey sys42.dev.technicolor()} {grey.dim ..} technicolor`)
    },
    technicolor() {
      log.color("#000")(
        `\n         ▄▄████▄▄\n  █ ▄ ▄▄██{bg.c3ff00 ▀▄  ▄▀}██\n  {0ff ▄} ▀▀▀▀██{bg.c3ff00  ▀  ▀ }██\n  {0ff ▀ █▄██}██{bg.c3ff00  ▄  ▄ }██\n  {f0f █ ▄ ▄▄}██{bg.c3ff00   ▀▀  }██\n  ▄ {f0f ▀▀▀▀}██{bg.c3ff00 ▄████▄}██\n  ▀ █▄███▀▀    ▀▀█\n`
      )
    },
    clear() {
      fetch("/?clear-site-data").then(() => location.reload())
    },
    pause() {
      dev.sse.enabled = false
      log("paused")
    },
    resume() {
      dev.sse.enabled = true
      log("resumed")
    },
    toggle() {
      dev.sse.enabled = !dev.sse.enabled
      log(dev.sse.enabled ? "resumed" : "paused")
    },
    async test(options = config.testRunner) {
      const testRunner = await import("./core/dev/testRunner.js") //
        .then((m) => m.default)
      if (config.testFiles) return testRunner(config.testFiles, options)
    },
    async env(full) {
      const env = await import("./core/env.js").then((m) => m.default)
      if (!full) return log(String(env))
      log(env)
    },
  }

  system.dev = dev

  if (inTop) {
    const sseLog = log
      .level(2)
      .blueBright /* .hour */
      .prefix("┃ 📡")

    dev.sse
      .on("connect", () => {
        if (inTop && dev.sse.enabled && dev.loaded) location.reload()
        dev.loaded = true
        sseLog(` connected {grey /42-dev}`)
      })
      .on("disconnect", () => sseLog(`💥 disconnected {grey /42-dev}`))
      .on("error", (msg) => sseLog(`💥 ${msg}`))
      .on("change", ({ data }) => {
        sseLog(` change ${log.format.file(data)}`)
        liveReload(data)
      })
      .on("reload", () => {
        location.reload()
      })

    const hasTestFlag = new URLSearchParams(location.search).has("test")
    if (config.testRunner && hasTestFlag) await dev.test()
  }
}
