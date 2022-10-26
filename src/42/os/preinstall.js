// @read https://medium.com/@kevinkurniawan97/introduction-to-pwa-twa-dcc2368268a3

/* eslint-disable camelcase */

import system from "../system.js"
import defer from "../fabric/type/promise/defer.js"
import pick from "../fabric/type/object/pick.js"
import inPWA from "../core/env/runtime/inPWA.js"
import mimetypesManager from "./managers/mimetypesManager.js"
import appCard from "./blocks/appCard.js"

const SHARED_MANIFEST_KEYS = ["description", "categories"]

const supportInstall =
  "relList" in HTMLLinkElement.prototype &&
  document.createElement("link").relList.supports("manifest") &&
  "onbeforeinstallprompt" in window

export default async function preinstall(app) {
  function resolve(url) {
    return new URL(url, app.dir).href
  }

  const manifest = {
    name: app.name,
    id: `42-${app.name}`,
    scope: resolve("."),
    start_url: resolve("."),
    display_override: ["window-controls-overlay", "minimal-ui"],
    display: "standalone",
    theme_color: window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--panel-bg"),
    ...pick(app, SHARED_MANIFEST_KEYS),
    icons: [
      {
        src: resolve("./icons/icon-16.png"),
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: resolve("./icons/icon-32.png"),
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: resolve("./icons/icon-144.png"),
        sizes: "144x144",
        type: "image/png",
      },
    ],
    ...(app.decode?.types
      ? {
          file_handlers: app.decode.types.map((type) => {
            const out = {}
            out.action = type.action ?? resolve(".")
            out.accept = mimetypesManager.resolve(type.accept)
            if (type.icons) out.icons = type.icons
            if (type.launch_type) out.launch_type = type.launch_type
            return out
          }),
        }
      : {}),
    // related_applications: [
    //   {
    //     platform: "webapp",
    //     url: resolve("./app.webmanifest"),
    //   },
    // ],
  }

  const manifestJSON = encodeURIComponent(JSON.stringify(manifest))
  const manifestURL = `data:application/manifest+json;name=app.webmanifest,${manifestJSON}`

  document.title = manifest.name

  const head = [
    document.createElement("meta"),
    document.createElement("link"),
    document.createElement("link"),
  ]

  head[0].name = "viewport"
  head[0].content = "width=device-width, initial-scale=1"

  head[1].rel = "icon"
  head[1].href = manifest.icons[0].src

  head[2].rel = "manifest"
  head[2].href = manifestURL

  document.head.append(...head)

  const installPrompt = defer()

  system.pwa = {}

  system.pwa.registration ??= navigator.serviceWorker
    ?.register("/42.sw.js", { type: "module" })
    .catch(installPrompt.reject)

  // if (inPWA) window.resizeTo(400, 350)
  // console.log(globalThis.navigator.windowControlsOverlay.getTitlebarAreaRect())

  // @read https://web.dev/file-handling/
  if (
    "launchQueue" in globalThis &&
    "files" in globalThis.LaunchParams.prototype
  ) {
    globalThis.launchQueue.setConsumer(({ files }) => {
      if (files.length === 0) return
      const undones = []
      for (const handle of files) undones.push(handle.getFile())
      system.pwa.files = Promise.all(undones)
    })
  }

  if (!supportInstall || inPWA) return false

  // // @read https://web.dev/get-installed-related-apps/
  // navigator.getInstalledRelatedApps().then((res) => {
  //   console.log("getInstalledRelatedApps", res)
  // })

  let card
  let displayApp

  // @read https://web.dev/customize-install/
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault()
    installPrompt.resolve(e)
    document.querySelector("#install")?.removeAttribute("disabled")
  })

  system.pwa.install = async function install() {
    const install = await installPrompt
    install.prompt()
    await install.userChoice
    card?.destroy()
    document.querySelector("#install-card")?.remove()
    displayApp?.resolve()
  }

  const params = new URLSearchParams(location.search)
  if (params.has("install")) {
    card = await import("../ui.js").then(({ default: ui }) => {
      ui({
        tag: ".box-fit.desktop.box-center.z-top",
        id: "install-card",
        content: {
          tag: ".panel.outset.pa-xl",
          content: [
            appCard(manifest),
            {
              tag: "button.w-full",
              id: "install",
              content: "Install as Web App",
              disabled: true,
              click: system.pwa.install,
            },
          ],
        },
      })
    })
    displayApp = defer()
    return displayApp
  }

  return system.pwa.install
}
