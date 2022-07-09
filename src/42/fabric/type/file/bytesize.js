// @thanks http://stackoverflow.com/a/18650828
// @read https://stackoverflow.com/a/25651291

import { round } from "../number/precision.js"

const K_SI = 1000 // 10 ** 3
const K_IEC = 1024 // 2 ** 10

const UNITS = {
  IEC: ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"],
  SI: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
}

const DEFAULTS = {
  SI: false,
  decimals: 2,
  string: true,
}

function toString() {
  return `${this.size} ${this.unit}`
}

export default function bytesize(bytes, options) {
  if (!Number.isInteger(bytes)) {
    if ("size" in bytes) bytes = bytes.size
    else if ("byteLength" in bytes) bytes = bytes.byteLength
  }

  const { SI, decimals, string } = { ...DEFAULTS, ...options }

  if (bytes === 0) {
    return string ? "0 B" : { size: 0, unit: "B", toString }
  }

  const k = SI ? K_SI : K_IEC
  const units = SI ? UNITS.SI : UNITS.IEC
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = round(bytes / k ** i, decimals)
  const unit = units[i]

  return string ? `${size} ${unit}` : { size, unit, toString }
}