import runtime from "./env/runtime.js"
import realm from "./env/realm.js"
import { UAParser } from "./env/parseUserAgent.js"
import getGPU from "./env/getGPU.js"
import languages from "./i18n/languages.js"
import disposable from "../fabric/traits/disposable.js"

const getUAParse = disposable(() => new UAParser())

export const env = Object.freeze({
  realm,
  runtime,

  get browser() {
    const uap = getUAParse()
    const browser = uap.getBrowser()
    const name = browser.name?.toLowerCase() ?? ""
    let version = browser.major
    version = Number.parseInt(version, 10)
    if (Number.isNaN(version)) version = 0
    return {
      name,
      version,
      semver: browser.version,
      isChrome: name.startsWith("chrom"),
      isEdge: name.startsWith("edge"),
      isFirefox: name.startsWith("firefox"),
      isIE: name.startsWith("ie"),
      isOpera: name.startsWith("opera"),
      isSafari: name.startsWith("safari"),
    }
  },

  get engine() {
    return getUAParse().getEngine()
  },

  get os() {
    return getUAParse().getOS()
  },

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
  },

  get cpu() {
    return {
      ...getUAParse().getCPU(),
      cores: globalThis.navigator?.hardwareConcurrency,
    }
  },

  get memory() {
    return { gigabytes: globalThis.navigator?.deviceMemory }
  },

  get gpu() {
    return getGPU()
  },

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
  },

  get languages() {
    return languages
  },

  [Symbol.toPrimitive]() {
    const { browser: b, os: o, device: d } = this
    let out = `${b.name ?? ""}${b.major ? ` ${b.major}` : ""}`
    if (d.type) out += ` (${d.type})`
    if (o.name) out += ` on ${o.name}${o.version ? ` ${o.version}` : ""}`
    if (d.vendor) out += `, ${d.vendor}${d.model ? ` ${d.model}` : ""}`
    return out
  },
})

export default env
