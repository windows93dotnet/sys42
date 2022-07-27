import { round } from "./precision.js"

export default function isMultipleOf(dividend, divisor) {
  if (!Number.isFinite(dividend) || !Number.isFinite(divisor)) return false

  const res = dividend / divisor
  if (res % 1 === 0) return true // fast check

  const str = String(divisor)

  const indexOfDec = str.indexOf(".")

  return indexOfDec > -1 //
    ? round(res, str.slice(indexOfDec + 1).length) % 1 === 0
    : false
}
