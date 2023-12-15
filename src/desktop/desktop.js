import os from "../42/os.js"
import ui from "../42/ui.js"
import client from "../42/os/network/client.js"
import clearSiteData from "../42/os/network/client/clearSiteData.js"

import trap from "../42/fabric/type/error/trap.js"
trap((err) => {
  os.desktop?.state.errors.push(err)
})

document.body.classList.add("desktop")

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
        {
          if: "{{/errors.length > 0}}",
          tag: ".solid.error",
          content: "{{/errors.length}} error(s)",
        },
      ],
    },
  ],

  state: {
    errors: [],
  },
})

/* Apps Manager
=============== */

// import actions from "../42/os/actions.js"
// actions.launchFolder("/tests/fixtures/formats/video/")
// actions.launchFile("/tests/fixtures/formats/video/example.mp4")
// actions.launchFile("/tests/fixtures/formats/example.html")
// actions.launchFile("/tests/fixtures/formats/video/example.mp4")
// actions.launchFile("/tests/fixtures/formats/image/example.jpg")
// actions.launchFile([
//   "/tests/fixtures/formats/example.json",
//   "/tests/fixtures/formats/example.json5",
// ])

// import appsManager from "../42/os/managers/appsManager.js"
// appsManager.launch("PixelEdit")

// import appsManager from "../42/os/managers/appsManager.js"
// appsManager.launch("Hydra")

// import appsManager from "../42/os/managers/appsManager.js"
// appsManager.launch("TextEdit")

// import appsManager from "../42/os/managers/appsManager.js"
// import sleep from "../42/fabric/type/promise/sleep.js"

// appsManager.launch("Sandbox", {
//   $files: [
//     // "/tests/fixtures/formats/example.json5",
//     "/tests/fixtures/formats/example.html",
//     // "/style.css",
//   ],
// })

// await sleep(100)

// appsManager.launch("TextEdit", {
//   $files: [
//     // "/tests/fixtures/formats/example.json5",
//     "/tests/fixtures/formats/example.html",
//     // "/style.css",
//   ],
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
