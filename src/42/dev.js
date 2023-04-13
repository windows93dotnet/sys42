import inTop from "./core/env/realm/inTop.js"
import inAutomated from "./core/env/runtime/inAutomated.js"
import system from "./system.js"
import log from "./core/log.js"
import clearSiteData from "./os/network/client/clearSiteData.js"
import configure from "./core/configure.js"

import getScriptData from "./core/dev/getScriptData.js"
import parseURLQuery from "./fabric/url/parseURLQuery.js"

const DEFAULT = {
  verbose: 2,
}

const config = configure(
  DEFAULT,
  getScriptData(import.meta.url)?.config,
  parseURLQuery(import.meta.url)
)

log.verbose = config.verbose

function greet() {
  log.if(config.verbose).cyanBright(`\
╷ ┌───┐  ${config.service ? "{dim.grey from service worker}" : ""}
└─┤ ┌─┘  {reset type} {grey sys42.dev.help()} {reset for help}
  └─┴─╴  `)
  log(
    `\n{cyan recommended devtool log filter: {reset -/both\\sallow-scripts|Clear-Site-Data|Skipping\\sunsupported/}}\n`
  )
}

if (inTop && inAutomated) {
  if (config.testFiles) {
    const testRunner = await import("./core/dev/testRunner.js") //
      .then((m) => m.default)
    testRunner(config.testFiles, { ...config.testRunner, report: false })
  }
} else if (!inAutomated) {
  if (inTop || config.verbose > 1) greet()

  const dev = {
    help() {
      log(log.esc`\
{grey sys42.dev.test(options)} {dim.grey ..} run tests
{grey sys42.dev.clear(options)} {dim.grey .} clear site data
{grey sys42.dev.pause()} {dim.grey ........} pause live-reload
{grey sys42.dev.resume()} {dim.grey .......} resume live-reload
{grey sys42.dev.toggle()} {dim.grey .......} toggle live-reload
{grey sys42.dev.technicolor()} {dim.grey ..} technicolor`)
    },
    technicolor() {
      log.color("#000")(
        `\n         ▄▄████▄▄\n  █ ▄ ▄▄██{bg.c3ff00 ▀▄  ▄▀}██\n  {0ff ▄} ▀▀▀▀██{bg.c3ff00  ▀  ▀ }██\n  {0ff ▀ █▄██}██{bg.c3ff00  ▄  ▄ }██\n  {f0f █ ▄ ▄▄}██{bg.c3ff00   ▀▀  }██\n  ▄ {f0f ▀▀▀▀}██{bg.c3ff00 ▄████▄}██\n  ▀ █▄███▀▀    ▀▀█\n`
      )
    },
    async clear(options) {
      await clearSiteData(options)
    },
    async test(options = config.testRunner) {
      const testRunner = await import("./core/dev/testRunner.js") //
        .then((m) => m.default)
      if (config.testFiles) return testRunner(config.testFiles, options)
    },
  }

  system.dev = dev

  if (inTop) {
    const [liveReload, serverSentEvents, client] = await Promise.all([
      import("./core/dev/liveReload.js") //
        .then((m) => m.default),
      import("./core/dev/serverSentEvents.js") //
        .then((m) => m.default),
      import("./os/network/client.js") //
        .then((m) => m.default),
    ])

    const sseLog = log
      .level(2)
      .blueBright /* .hour */
      .prefix("┃ 🔭")

    let loaded = false

    dev.sse = serverSentEvents("/42-dev")

    dev.pause = () => {
      dev.sse.enabled = false
      log("paused")
    }

    dev.resume = () => {
      dev.sse.enabled = true
      log("resumed")
    }

    dev.toggle = () => {
      dev.sse.enabled = !dev.sse.enabled
      log(dev.sse.enabled ? "resumed" : "paused")
    }

    dev.sse
      .on("connect", () => {
        if (inTop && dev.sse.enabled && loaded) location.reload()
        loaded = true
        sseLog(` connected {grey /42-dev}`)
      })
      .on("disconnect", () => sseLog(`💥 disconnected {grey /42-dev}`))
      .on("error", (msg) => sseLog(`💥 ${msg}`))
      .on("change", async ({ data }) => {
        sseLog(` change ${log.format.file(data)}`)
        await client.bus?.send("42_SW_CACHE_BUST", data)
        liveReload(data)
      })
      .on("reload", () => {
        location.reload()
      })
  }
}
