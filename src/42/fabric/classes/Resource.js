// @read https://developer.chrome.com/blog/anonymous-iframe-origin-trial/
// @read https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Feature-Policy#directives
// @read https://featurepolicy.info/

import uid from "../../core/uid.js"
import configure from "../../core/configure.js"
import ipc from "../../core/ipc.js"
import arrify from "../type/any/arrify.js"
import listen from "../event/listen.js"
import dispatch from "../event/dispatch.js"
import isURLIframable from "../url/isURLIframable.js"

const DEFAULTS = {
  upgradeInsecureRequests: true,
  checkIframable: false,
  referrerpolicy: "same-origin",
  permissions: undefined,
  signal: undefined,
}

const CSP = `default-src ${location.origin} 'unsafe-inline' data: blob:;`

const { href: errorCatcher } = new URL(
  "./Resource/raiseErrorTop.js",
  import.meta.url,
)

const SUPPORTED_FEATURES = document.featurePolicy?.features() ?? undefined

const DISALLOWED_FEATURES = [
  // "ambient-light-sensor",
  // "battery",
  "document-domain",
  "encrypted-media",
  // "execution-while-not-rendered",
  // "execution-while-out-of-viewport",
  // "layout-animations",
  // "legacy-image-formats",
  "magnetometer",
  // "navigation-override",
  // "oversized-images",
  "payment",
  "picture-in-picture",
  "publickey-credentials-get",
  // "speaker-selection",
  // "sync-xhr",
  // "unoptimized-images",
  // "unsized-media",
  "usb",
  "screen-wake-lock",
  // "web-share",
]

const APP_FEATURES = [
  "accelerometer",
  "autoplay",
  "camera",
  "display-capture",
  "focus-without-user-activation",
  "fullscreen",
  "gamepad",
  "geolocation",
  "gyroscope",
  "microphone",
  "midi",
  "xr-spatial-tracking",
]

export const ALLOW_PRESETS = {}

ALLOW_PRESETS.code = [
  "scripts", //
]
ALLOW_PRESETS.storage = [
  "scripts", //
  "downloads",
]
ALLOW_PRESETS.game = [
  "scripts",
  "focus-without-user-activation",
  "fullscreen",
  "gamepad",
  "pointer-lock",
]
ALLOW_PRESETS.app = [
  "scripts",
  "downloads",
  "presentation",
  "orientation-lock",
  "pointer-lock",
  ...APP_FEATURES,
]
ALLOW_PRESETS.trusted = [
  ...ALLOW_PRESETS.app, //
  "same-origin",
]
ALLOW_PRESETS.web = [
  ...ALLOW_PRESETS.trusted,
  "forms",
  "modals",
  "popups",
  // "popups-to-escape-sandbox",
]
ALLOW_PRESETS.all = [...ALLOW_PRESETS.web, ...DISALLOWED_FEATURES]
ALLOW_PRESETS["*"] = ALLOW_PRESETS.all

const FEATURES = new Set([...APP_FEATURES, ...DISALLOWED_FEATURES])

export default class Resource {
  constructor(options) {
    if ("sandbox" in HTMLIFrameElement.prototype === false) {
      throw new DOMException("Sandbox not supported", "SecurityError")
    }

    if (options?.signal) {
      this.forgetSignal = listen(options?.signal, {
        abort: () => this.destroy(),
      })
    }

    this.config = configure(DEFAULTS, options)

    const permissions = this.config.permissions
      ? this.config.permissions in ALLOW_PRESETS
        ? ALLOW_PRESETS[this.config.permissions]
        : this.config.permissions
      : []

    this.el = document.createElement("iframe")
    this.el.id = uid()
    this.el.name = `42-resource-${this.el.id}`
    this.el.referrerpolicy = this.config.referrerpolicy
    this.el.fetchpriority = "high"

    this.#addBus()

    const allowList = []

    this.el.toggleAttribute("sandbox", true)
    for (const x of arrify(permissions)) {
      if (FEATURES.has(x)) allowList.push(x)
      else {
        const token = x.startsWith("allow-") ? x : `allow-${x}`
        if (this.el.sandbox.supports(token)) this.el.sandbox.add(token)
        else {
          throw new DOMException(
            `Sandbox token not supported: ${token}`,
            "SecurityError",
          )
        }
      }
    }

    const allow = []
    for (const perm of FEATURES) {
      if (
        SUPPORTED_FEATURES === undefined ||
        SUPPORTED_FEATURES.includes(perm)
      ) {
        // if (allowList.includes(perm)) allow.push(`${perm} 'src' ${origin}`)
        if (allowList.includes(perm)) allow.push(`${perm} *`)
        else allow.push(`${perm} 'none'`)
      }
    }

    this.el.allow = allow.join("; ")
  }

  #addBus() {
    this.bus = ipc.from(this.el)
    this.bus
      .on("42_IFRAME_ERROR", async (err) => {
        const [deserializeError] = await Promise.all([
          import("../type/error/deserializeError.js") //
            .then((m) => m.default),
        ])
        dispatch(this.el, deserializeError(err))
      })
      .on("42_IFRAME_BLUR", () => {
        dispatch(this.el, "uiiframeblur", { bubbles: true })
      })
  }

  async html(html, options) {
    const head = options?.head ?? ""
    const body = options?.body ?? ""
    this.el.removeAttribute("src")
    this.el.srcdoc = /* html */ `
      <!doctype html>
      <meta charset="utf-8" />
      <!-- <meta http-equiv="Content-Security-Policy" content="${CSP}" /> -->
      ${head}
      <script type="module" src="${errorCatcher}"></script>
      ${body}
      ${html}
    `

    await 0 // queueMicrotask
  }

  async script(script, options) {
    const type = options?.type ?? "module"
    await this.html(`<script type="${type}">${script}</script>`, options)
  }

  async go(url, { signal } = this.config) {
    url = new URL(url, location.href)

    if (this.config.permissions === "web" && url.origin === location.origin) {
      throw new DOMException(
        `"web" permission is only allowed for different origin`,
        "SecurityError",
      )
    }

    if (
      this.config.upgradeInsecureRequests &&
      url.protocol === "http:" &&
      location.protocol === "https:"
    ) {
      url.protocol = "https:"
    }

    return new Promise((resolve, reject) => {
      this.forgets = []

      const end = (ok) => {
        ok ? resolve() : reject()
        if (!ok) this.el.removeAttribute("src")
        for (const forget of this.forgets) forget()
        this.forgets.length = 0
      }

      if (signal) {
        this.forgets.push(
          listen(signal, {
            abort: () => {
              this.el.removeAttribute("src")
              end(true)
            },
          }),
        )
      }

      this.el.removeAttribute("srcdoc")
      this.el.src = url

      if (this.config.checkIframable) {
        isURLIframable(url, signal).then((ok) => end(ok))
      } else {
        this.forgets.push(
          listen(this.el, {
            signal,
            load: () => end(true),
            error: () => end(false),
          }),
        )
      }
    })
  }

  destroy() {
    this.forgetSignal?.()

    if (this.forgets?.length) {
      for (const forget of this.forgets) forget()
      this.forgets.length = 0
      this.forgets = undefined
    }

    this.bus?.destroy()
    this.bus = undefined
    this.el?.removeAttribute("src")
    this.el?.removeAttribute("srcdoc")
    this.el?.remove()
    this.el = undefined
  }
}
