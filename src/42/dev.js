import inTop from "./core/env/realm/inTop.js"
import inAutomated from "./core/env/runtime/inAutomated.js"
import system from "./system.js"
import log from "./core/log.js"

import getScriptData from "./fabric/getScriptData.js"
const { config } = getScriptData(import.meta)

// config.verbose = 2
log.verbose = config.verbose

function greet() {
  log.if(config.verbose).cyanBright(`\
╷ ┌───┐
└─┤ ┌─┘  {white type} {cyanBright sys42}{cyan .dev.help()}
  └─┴─╴`)
}

if (inTop && inAutomated) {
  if (config.testFiles) {
    const testRunner = await import("./fabric/dev/liveReload.js") //
      .then((m) => m.default)
    testRunner(config.testFiles, { ...config.testRunner, report: false })
  }
} else if (!inAutomated) {
  if (inTop || config.verbose > 2) greet()

  const liveReload = await import("./fabric/dev/liveReload.js") //
    .then((m) => m.default)
  const serverSentEvents = await import("./fabric/dev/serverSentEvents.js") //
    .then((m) => m.default)

  const dev = {
    loaded: false,
    sse: serverSentEvents("/42-dev"),
    help() {
      log(log.esc`\
{cyanBright sys42}{cyan .dev.test(options)} {grey ..} run tests
{cyanBright sys42}{cyan .dev.tree(element)} {grey ..} display accessibility tree
{cyanBright sys42}{cyan .dev.env(full)} {grey ......} display env
{cyanBright sys42}{cyan .dev.pause()} {grey ........} pause live-reload
{cyanBright sys42}{cyan .dev.resume()} {grey .......} resume live-reload
{cyanBright sys42}{cyan .dev.toggle()} {grey .......} toggle live-reload
{cyanBright sys42}{cyan .dev.technicolor()} {grey ..} technicolor`)
    },
    technicolor() {
      log.color("#000")(
        `\n         ▄▄████▄▄\n  █ ▄ ▄▄██{bg.c3ff00 ▀▄  ▄▀}██\n  {0ff ▄} ▀▀▀▀██{bg.c3ff00  ▀  ▀ }██\n  {0ff ▀ █▄██}██{bg.c3ff00  ▄  ▄ }██\n  {f0f █ ▄ ▄▄}██{bg.c3ff00   ▀▀  }██\n  ▄ {f0f ▀▀▀▀}██{bg.c3ff00 ▄████▄}██\n  ▀ █▄███▀▀    ▀▀█\n`
      )
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
      log(dev.sse.enabled ? "paused" : "resumed")
    },
    async test(options = config.testRunner) {
      const testRunner = await import("./fabric/dev/liveReload.js") //
        .then((m) => m.default)
      if (config.testFiles) return testRunner(config.testFiles, options)
    },
    async env(full) {
      const env = await import("./core/env.js").then((m) => m.default)
      if (!full) return log(String(env))
      log(env)
    },
    // async tree(el = document.body) {
    //   const printAccessibilityTree = await import(
    //     "./type/aom/printAccessibilityTree.js"
    //   ).then((m) => m.default)
    //   printAccessibilityTree(el)
    // },
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

    const hasTestFlag = new URL(location.href).searchParams.has("test")
    if (config.testRunner && hasTestFlag) await dev.test()
  }
}
