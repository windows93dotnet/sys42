import os from "../42/os.js"
import ui from "../42/ui.js"
import client from "../42/os/network/client.js"
import clearSiteData from "../42/os/network/client/clearSiteData.js"

import trap from "../42/fabric/type/error/trap.js"
let cnt = 0
let idleId
trap((err) => {
  cnt++
  cancelIdleCallback(idleId)
  if (cnt > 10) {
    // Too many alerts
    idleId = requestIdleCallback(() => (cnt = 0))
    return
  }

  import("../42/ui/invocables/alert.js").then(({ alert }) => alert(err))
  return false
})

await client.connect()

os.desktop = await ui({
  tag: "body.box-fit.box-v._debug",
  content: [
    {
      scope: "desktop",
      tag: "main#desktop.desktop",
      content: [
        {
          tag: "ui-folder.box-fit.scroll-auto",
          // path: "$HOME/desktop/",
          path: "/tests/fixtures/formats/",
          transferable: {
            accept: { kind: ["42_TR_ICON", "42_TR_APP_TAB"] },
            import({ kind }) {
              if (kind.includes("42_TR_APP_TAB")) {
                console.log("TODO: make app tab import")
                return "revert"
              }
            },
          },
        },
      ],
    },
    {
      scope: "taskbar",
      tag: "footer#taskbar.d-flex.outset.pa-xs",
      content: [
        {
          tag: "button",
          content: "Start",
          picto: "puzzle",
          async menu() {
            const apps = await os.apps.makeMenu()
            return [
              ...apps,
              "---",
              {
                label: "Format Disk",
                click: () => clearSiteData({ reload: true }),
              },
            ]
          },
        },
        {
          tag: "button.ma-l-auto",
          content: "Format Disk",
          picto: "cross-alt",
          click: () => clearSiteData({ reload: true }),
        },
      ],
    },
  ],
})

/* Apps Manager Exemples
======================== */

// os.actions.launchFolder("/tests/fixtures/formats/video/")
// os.actions.launchFile("/tests/fixtures/formats/video/example.mp4")
// os.actions.launchFile("/tests/fixtures/formats/example.html")
// os.actions.launchFile("/tests/fixtures/formats/video/example.mp4")
// os.actions.launchFile("/tests/fixtures/formats/image/example.jpg")
// os.actions.launchFile([
//   "/tests/fixtures/formats/example.json",
//   "/tests/fixtures/formats/example.json5",
// ])

// os.apps.launch("Hydra")

// os.apps.launch("TextEdit")

// os.apps.launch("Sandbox", {
//   state: {
//     $files: [
//       "/tests/fixtures/formats/example.html", //
//     ],
//   },
// })

// os.apps.launch("TextEdit", {
//   state: {
//     $files: [
//       // "/tests/fixtures/formats/example.json5",
//       "/tests/fixtures/formats/example.html",
//       // "/style.css",
//     ],
//   },
// })

// console.log(await os.apps.lookup("index.html"))

// console.log(...(await os.apps.makeMenu("index.html")))
// console.log(...(await os.apps.makeMenu({ mimetype: "*" })))
// console.log(...(await os.apps.makeMenu()))
// console.log(
//   ...(await os.apps.makeMenu([
//     "index.html", //
//     "script.js",
//     "image.gif",
//   ])),
// )

/* Vhost experiment
=================== */

// import fs from "../42/core/fs.js"
// // import actions from "../42/os/actions.js"

// try {
//   await fs.deleteDir("/tests/fixtures/formats/r")
// } catch {}

// const html = `\
// <title>Hello</title>
// <link rel="stylesheet" href="./test.css">
// <h1>hello</h1>`

// const css = `\
// @import url("./fonts.css");
// body {
//   background-color: tan;
// }`

// const fonts = `\
// body {
//   font-family: monospace;
// }`

// const populate = async () => {
//   await Promise.all([
//     fs.write("/tests/fixtures/formats/r/test.html", html), //
//     fs.write("/tests/fixtures/formats/r/test.css", css),
//     fs.write("/tests/fixtures/formats/r/fonts.css", fonts),
//   ])
// }

// setTimeout(() => populate(), 1000)

// // actions.launchFile("/tests/fixtures/formats/r/test.html")
