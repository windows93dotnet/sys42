import os from "../42/os.js"
import ui from "../42/ui.js"
import client from "../42/os/network/client.js"
import clearSiteData from "../42/os/network/client/clearSiteData.js"

import trap from "../42/fabric/type/error/trap.js"
trap((err) => {
  os.desktop.state.errors.push(err)
})

os.network ??= {
  vhost: "http://localhost:3000/42/os/network/client/vhost.html",
}

await client.connect({ verbose: 2 })

document.body.classList.add("desktop")

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
          if: "{{/errors.length > 0}}",
          tag: ".solid.error.ma-l-auto",
          content: "{{/errors.length}} error(s)",
        },
      ],
    },
  ],

  state: {
    errors: [],
  },
})

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
// appsManager.launch("TextEdit", {
//   $files: [
//     "/tests/fixtures/formats/example.json5",
//     "/tests/fixtures/formats/example.html",
//     "/style.css",
//   ],
// })

// console.log(await os.apps.lookup("index.html"))
// console.log(...(await os.apps.makeMenu("index.html")))
// console.log(...(await os.apps.makeMenu()))

/*  */

import fs from "../42/core/fs.js"
import actions from "../42/os/actions.js"
import sleep from "../42/fabric/type/promise/sleep.js"

const html = `\
<title>Hello</title>
<link rel="stylesheet" href="./test.css">
<h1>hello</h1>`

const css = `\
body {
  background-color: tan;
  font-family: sans-serif;
}`

await Promise.all([
  fs.write("/tests/fixtures/formats/test.html", html), //
  fs.write("/tests/fixtures/formats/test.css", css),
])

await sleep(1000)

actions.launchFile("/tests/fixtures/formats/test.html")
// actions.launchFile("/tests/fixtures/formats/test.css")
