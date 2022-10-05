/* eslint-disable camelcase */

import defer from "../../fabric/type/promise/defer.js"
import inOpaqueOrigin from "../../core/env/realm/inOpaqueOrigin.js"

export default function preinstall(app) {
  function resolve(url) {
    return new URL(url, app.dir).href
  }

  const manifest = {
    name: app.name,
    categories: app.categories ?? [],
    display: "standalone",
    id: `42-${app.name}`,
    start_url: resolve("."),
    // background_color: "#c0c0c0",
    // theme_color: "#c0c0c0",
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

  // https://web.dev/customize-install/

  window.addEventListener(
    "beforeinstallprompt",
    (e) => {
      e.preventDefault()
      deferred.resolve(e)
    },
    { once: true }
  )

  return async function () {
    const install = await deferred
    install.prompt()
    const { outcome } = await install.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
  }
}
