const threshold = 5000

let warned = false

const processes = {
  edge: "msedge",
}

export default async function chromiumBugWarning(ua) {
  if (warned) return

  if (process.platform !== "linux") return

  const parseUserAgent = await import(
    "../../src/42/core/env/parseUserAgent.js"
  ).then((m) => m.default)

  ua = parseUserAgent(ua)
  if (ua.engine.name !== "Blink") return

  warned = true

  const name = ua.browser.name.toLowerCase()
  const processName = processes[name] ?? name

  const [log, exec] = await Promise.all([
    import("../../src/42/core/log.js").then((m) => m.default),
    import("node:child_process").then((m) => m.exec),
  ])

  exec(
    `cat /proc/$(pidof -s ${processName})/limits`,
    (error, stdout, stderr) => {
      if (error || stderr) return

      const matches = stdout.match(/Max open files\s+(\d+)\s+(\d+)/)
      if (!matches) return

      let [, soft, hard] = matches
      soft = Number(soft)
      hard = Number(hard)

      if (soft < threshold || hard < threshold) {
        log.yellowBright(`
┃  {yellow ⚠️ Chromium based browsers on Linux may freeze while loading}
┃  {yellow a large number of javascript files when devtools is open}
┃
┃  A workaround is to increase the max open file limit (nofile)
┃  Either temporarily by executing {yellow ulimit -n 9999} prior to openning the browser
┃  Or by changing it system-wide using {yellow /etc/security/limits.conf}
┃
┃  This warning is displayed if the limit is under {yellow ${threshold}} (current: {yellow ${soft}})
┃
┃  Chromium bug: {blue https://crbug.com/1263267}
`)
      }
    },
  )
}
