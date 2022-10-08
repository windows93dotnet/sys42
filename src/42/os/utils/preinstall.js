// @read https://medium.com/@kevinkurniawan97/introduction-to-pwa-twa-dcc2368268a3

/* eslint-disable camelcase */

import defer from "../../fabric/type/promise/defer.js"
import pick from "../../fabric/type/object/pick.js"
import inOpaqueOrigin from "../../core/env/realm/inOpaqueOrigin.js"
import inStandalone from "../../core/env/runtime/inStandalone.js"

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
    display: "standalone",
    id: `42-${app.name}`,
    scope: resolve("."),
    start_url: resolve("."),
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
    file_handlers: [
      {
        action: resolve("."),
        accept: {
          "text/plain": [".txt"],
          "text/html": [".html", ".htm", ".xhtm"],
          "text/css": [".css"],
          "text/javascript": [".js", ".mjs"],
        },
      },
    ],
    related_applications: [
      {
        platform: "webapp",
        url: resolve("./app.webmanifest"),
      },
    ],
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

  const deferred = defer()

  if (!inOpaqueOrigin) {
    navigator.serviceWorker
      ?.register("/42.sw.js", { type: "module" })
      .catch(deferred.reject)
  }

  if (!supportInstall || inStandalone) return false

  // https://web.dev/customize-install/

  window.addEventListener(
    "beforeinstallprompt",
    (e) => {
      e.preventDefault()
      deferred.resolve(e)
      document.querySelector("#install")?.removeAttribute("disabled")
    },
    { once: true }
  )

  // // https://web.dev/get-installed-related-apps/
  // navigator.getInstalledRelatedApps().then((res) => {
  //   console.log("getInstalledRelatedApps", res)
  // })

  let card

  async function install() {
    const install = await deferred
    install.prompt()
    await install.userChoice
    card?.destroy()
    document.querySelector("#install-card")?.remove()
  }

  const params = new URLSearchParams(location.search)
  if (params.has("install")) {
    card = await import("../../ui.js").then(({ default: ui }) => {
      ui({
        tag: ".box-fit.ground.box-center",
        id: "install-card",
        content: {
          tag: ".outset.pa-xl",
          content: [
            {
              tag: ".box-v.mb-xl",
              content: [
                { tag: "img.inset", src: "{{icons/2/src}}" },
                {
                  tag: ".pa",
                  content: [
                    { tag: "h1.mt-0", content: "{{name}}" },
                    { tag: "p.mt-0", content: "{{description}}" },
                    {
                      tag: ".d-flex.gap-sm",
                      content: {
                        scope: "categories",
                        each: {
                          tag: "span.pill",
                          content: "{{titleCase(.)}}",
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              tag: "button.w-full",
              id: "install",
              content: "Install",
              disabled: true,
              click: install,
            },
          ],
        },
        state: manifest,
      })
    })
    return true
  }

  return install
}
