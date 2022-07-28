import * as runtime from "./env/runtime.js"
import { UAParser } from "./env/parseUserAgent.js"
import getGPU from "./env/getGPU.js"
import languages from "./i18n/languages.js"
import disposable from "../fabric/traits/disposable.js"

const getUAParse = disposable(() => new UAParser())

export class ENV {
  get runtime() {
    return Object.assign(Object.create(null), runtime)
  }

  get browser() {
    const uap = getUAParse()
    const browser = uap.getBrowser()
    const name = browser.name?.toLowerCase() ?? ""
    const { major } = browser
    browser.major = Number.parseInt(major, 10)
    if (Number.isNaN(browser.major)) browser.major = major
    return {
      isChrome: name.startsWith("chrom"),
      isEdge: name.startsWith("edge"),
      isFirefox: name.startsWith("firefox"),
      isIE: name.startsWith("ie"),
      isOpera: name.startsWith("opera"),
      isSafari: name.startsWith("safari"),
      ...browser,
    }
  }

  get engine() {
    return getUAParse().getEngine()
  }

  get os() {
    return getUAParse().getOS()
  }

  get device() {
    const device = getUAParse().getDevice()
    device.type =
      device.type ||
      (globalThis.navigator?.userAgentData
        ? globalThis.navigator?.userAgentData.mobile
          ? "mobile"
          : "desktop"
        : runtime.inFrontend
        ? "desktop"
        : undefined)
    return device
  }

  get cpu() {
    return {
      ...getUAParse().getCPU(),
      cores: globalThis.navigator?.hardwareConcurrency,
    }
  }

  get memory() {
    return { gigabytes: globalThis.navigator?.deviceMemory }
  }

  get gpu() {
    return getGPU()
  }

  get network() {
    return {
      get online() {
        return globalThis.navigator?.onLine
      },
      get type() {
        return globalThis.navigator?.connection?.type
      },
      get effectiveType() {
        return globalThis.navigator?.connection?.effectiveType
      },
    }
  }

  get languages() {
    return languages
  }

  toJSON() {
    const json = {}

    const proto = Object.getPrototypeOf(this)
    const descriptors = Object.getOwnPropertyDescriptors(proto)
    for (const key in descriptors) {
      if (!(key === "constructor" || key === "toString" || key === "toJSON")) {
        json[key] = this[key]
      }
    }

    return json
  }

  toString() {
    const { browser: b, os: o, device: d } = this
    let out = `${b.name ?? ""}${b.major ? ` ${b.major}` : ""}`
    if (d.type) out += ` (${d.type})`
    if (o.name) out += ` on ${o.name}${o.version ? ` ${o.version}` : ""}`
    if (d.vendor) out += `, ${d.vendor}${d.model ? ` ${d.model}` : ""}`
    return out
  }
}

export default new ENV()
