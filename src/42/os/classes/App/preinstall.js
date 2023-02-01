// @read https://medium.com/@kevinkurniawan97/introduction-to-pwa-twa-dcc2368268a3

/* eslint-disable camelcase */

import system from "../../../system.js"
import defer from "../../../fabric/type/promise/defer.js"
import pick from "../../../fabric/type/object/pick.js"
import inPWA from "../../../core/env/runtime/inPWA.js"
import supportInstall from "../../../core/env/supportInstall.js"
import mimetypesManager from "../../managers/mimetypesManager.js"
import appCard from "../../blocks/appCard.js"
import uid from "../../../core/uid.js"
import { merge } from "../../../core/configure.js"

const SHARED_MANIFEST_KEYS = ["description", "categories", "icons"]

export default async function preinstall(manifest) {
  await mimetypesManager.ready

  if (manifest.pwa) merge(manifest, manifest.pwa)

  let hasMinIconSize
  let icon32
  for (const icon of manifest.icons) {
    icon.src = new URL(icon.src, manifest.dirURL).href
    if (icon.sizes === "32x32") icon32 = icon
    else if (Number.parseInt(icon.sizes.split("x")[0], 10) >= 144) {
      hasMinIconSize = true
      break
    }
  }

  if (!hasMinIconSize) {
    const resizeImage = await import("../../../fabric/img/resizeImage.js") //
      .then(({ resizeImage }) => resizeImage)

    const img = new Image()
    img.src = icon32.src

    await Promise.all([
      resizeImage(img, 160, { output: "url" }).then((src) => {
        manifest.icons.push({
          src,
          sizes: "160x160",
          type: "image/png",
        })
      }),
      resizeImage(img, 160, { padding: 32, output: "url" }).then((src) => {
        manifest.icons.push({
          src,
          sizes: "160x160",
          type: "image/png",
          purpose: "maskable",
        })
      }),
    ])
  }

  const webmanifest = {
    name: manifest.name,
    id: `42-${manifest.slug}`,
    scope: manifest.dirURL,
    start_url: manifest.dirURL,
    display: "standalone",
    display_override: [
      // TODO: experiment with borderless https://github.com/sonkkeli/borderless/blob/main/EXPLAINER.md#proposal
      "window-controls-overlay", //
      "minimal-ui",
    ],
    theme_color: window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--panel-bg")
      .trim(),

    ...pick(manifest, SHARED_MANIFEST_KEYS),

    ...(manifest.decode?.types
      ? { file_handlers: manifest.decode.types }
      : undefined),

    related_applications: [
      { platform: "webapp", url: `${manifest.dirURL}app.webmanifest` },
    ],
  }

  const manifestJSON = encodeURIComponent(JSON.stringify(webmanifest))
  const manifestURL = `data:application/manifest+json;name=${manifest.dirURL}app.webmanifest,${manifestJSON}`

  document.title = webmanifest.name

  const head = [
    document.createElement("meta"),
    document.createElement("link"),
    document.createElement("link"),
  ]

  head[0].name = "viewport"
  head[0].content = "width=device-width, initial-scale=1"

  if (webmanifest.icons?.length) {
    head[1].rel = "icon"
    head[1].href = webmanifest.icons[0].src
  }

  head[2].rel = "manifest"
  head[2].href = manifestURL

  document.head.append(...head)

  const installPrompt = defer()

  system.pwa = {}

  // system.pwa.registration ??= navigator.serviceWorker
  //   ?.register("/42.sw.js", { type: "module" })
  //   .catch(installPrompt.reject)

  // console.log(globalThis.navigator.windowControlsOverlay.getTitlebarAreaRect())

  // @read https://web.dev/file-handling/
  if (
    "launchQueue" in globalThis &&
    "files" in globalThis.LaunchParams.prototype
  ) {
    globalThis.launchQueue.setConsumer(({ files }) => {
      if (files.length === 0) return
      system.pwa.handles ??= new Map()
      const undones = []
      for (const handle of files) {
        undones.push(
          handle.getFile().then((file) => {
            const id = uid()
            system.pwa.handles.set(id, handle)
            return { id, file }
          })
        )
      }

      system.pwa.files = Promise.all(undones)
    })
  }

  if (!supportInstall || inPWA) return false

  // @read https://web.dev/get-installed-related-apps/
  navigator.getInstalledRelatedApps().then((res) => {
    console.log("getInstalledRelatedApps", res)
  })

  let card
  let displayApp

  // @read https://web.dev/customize-install/
  window.addEventListener("beforeinstallprompt", async (e) => {
    e.preventDefault()
    installPrompt.resolve(e)
    card = await card
    document.querySelector("#install")?.removeAttribute("disabled")
  })

  system.pwa.install = async function install() {
    const install = await installPrompt
    install.prompt()
    await install.userChoice
    card = await card
    card?.destroy()
    document.querySelector("#install-card")?.remove()
    displayApp?.resolve()

    if (manifest.width && manifest.height) {
      window.resizeTo(manifest.width, manifest.height)
    }
  }

  if (inPWA && manifest.width && manifest.height) {
    window.resizeTo(manifest.width, manifest.height)
  }

  const params = new URLSearchParams(location.search)
  if (params.has("install")) {
    card = import("../../../ui.js").then(({ default: ui }) => {
      const content = appCard(webmanifest)
      content.content.push({
        tag: "button.w-full.ma-t-xl",
        id: "install",
        content: "Install as Web App",
        disabled: true,
        click: system.pwa.install,
      })
      return ui({
        plugins: ["markdown"],
        tag: ".box-fit.desktop.box-center.z-top",
        id: "install-card",
        content: {
          tag: ".panel.outset.pa-xl",
          content,
        },
      })
    })
    displayApp = defer()
    return displayApp
  }

  return system.pwa.install
}
