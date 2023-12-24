import runtime from "./env/runtime.js"
import realm from "./env/realm.js"
import { UAParser } from "./env/parseUserAgent.js"
import getGPU from "./env/getGPU.js"
import languages from "./i18n/languages.js"
import disposable from "../fabric/traits/disposable.js"

const getUAParse = disposable(() => new UAParser())
const enumerable = true

const properties = {
  browser: {
    enumerable,
    get() {
      const uap = getUAParse()
      const browser = uap.getBrowser()
      const name = browser.name?.toLowerCase() ?? ""
      let version = browser.major
      version = Number.parseInt(version, 10)
      if (Number.isNaN(version)) version = 0
      return Object.freeze({
        name,
        version,
        semver: browser.version,
        isChrome: name.startsWith("chrom"),
        isEdge: name.startsWith("edge"),
        isFirefox: name.startsWith("firefox"),
        isIE: name.startsWith("ie"),
        isOpera: name.startsWith("opera"),
        isSafari: name.startsWith("safari"),
      })
    },
  },

  engine: {
    enumerable,
    get: () => Object.freeze(getUAParse().getEngine()),
  },

  os: {
    enumerable,
    get: () => Object.freeze(getUAParse().getOS()),
  },

  device: {
    enumerable,
    get() {
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
      return Object.freeze(device)
    },
  },

  cpu: {
    enumerable,
    get: () =>
      Object.freeze({
        ...getUAParse().getCPU(),
        cores: globalThis.navigator?.hardwareConcurrency,
      }),
  },

  memory: {
    enumerable,
    get: () => Object.freeze({ gigabytes: globalThis.navigator?.deviceMemory }),
  },

  gpu: {
    enumerable,
    get: () => Object.freeze(getGPU()),
  },

  network: {
    enumerable,
    get: () =>
      Object.freeze({
        get online() {
          return globalThis.navigator?.onLine
        },
        get type() {
          return globalThis.navigator?.connection?.type
        },
        get effectiveType() {
          return globalThis.navigator?.connection?.effectiveType
        },
      }),
  },

  languages: {
    enumerable,
    get: () => languages,
  },
}

class Env {
  constructor() {
    this.realm = realm
    this.runtime = runtime
    Object.defineProperties(this, properties)
    Object.freeze(this)
  }

  [Symbol.toPrimitive]() {
    const { browser: b, os: o, device: d } = this
    let out = `${b.name ?? ""}${b.major ? ` ${b.major}` : ""}`
    if (d.type) out += ` (${d.type})`
    if (o.name) out += ` on ${o.name}${o.version ? ` ${o.version}` : ""}`
    if (d.vendor) out += `, ${d.vendor}${d.model ? ` ${d.model}` : ""}`
    return out
  }

  toString() {
    return this[Symbol.toPrimitive]()
  }
}

export const env = new Env()
export default env
