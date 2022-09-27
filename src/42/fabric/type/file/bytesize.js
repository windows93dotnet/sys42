// @thanks http://stackoverflow.com/a/18650828
// @read https://stackoverflow.com/a/25651291

import { round } from "../number/precision.js"
import trailZeros from "../number/trailZeros.js"

const K_SI = 1000 // 10 ** 3
const K_IEC = 1024 // 2 ** 10

const UNITS = {
  IEC: ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"],
  SI: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
}

const DEFAULTS = {
  SI: false,
  decimals: 2,
  asString: true,
  trailingZeros: true,
}

const { floor, log } = Math

function toString() {
  return `${this.string}`
}

export default function bytesize(bytes, options) {
  if (!Number.isInteger(bytes)) {
    if ("size" in bytes) bytes = bytes.size
    else if ("byteLength" in bytes) bytes = bytes.byteLength
  }

  const { SI, decimals, asString, trailingZeros } = { ...DEFAULTS, ...options }

  if (bytes === 0) {
    const string = `${trailingZeros ? trailZeros(0, decimals) : 0} B`
    return asString ? string : { size: 0, unit: "B", string, toString }
  }

  const k = SI ? K_SI : K_IEC
  const units = SI ? UNITS.SI : UNITS.IEC
  const i = floor(log(bytes) / log(k))
  const unit = units[i]

  const size = round(bytes / k ** i, decimals)

  const string = `${trailingZeros ? trailZeros(size, decimals) : size} ${unit}`
  return asString ? string : { size, unit, string, toString }
}
