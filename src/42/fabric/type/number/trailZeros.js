export default function trailZeros(num, decimals = 2) {
  const n = String(num)
  const index = n.indexOf(".")
  return `${n.slice(0, index) || "0"}.${n
    .slice(index + 1)
    .padEnd(decimals, "0")}`
}
