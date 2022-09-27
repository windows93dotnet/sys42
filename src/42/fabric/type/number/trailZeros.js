export default function trailZeros(num, decimals = 2) {
  const n = String(num)
  if (decimals === 0) return n
  const index = n.indexOf(".")
  if (index === -1) return `${n}.${"0".repeat(decimals)}`
  return `${n.slice(0, index) || "0"}.${n
    .slice(index + 1)
    .padEnd(decimals, "0")}`
}
