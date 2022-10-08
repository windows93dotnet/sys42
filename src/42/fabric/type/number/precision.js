// @thanks https://www.30secondsofcode.org/js/s/round
// @thanks https://stackoverflow.com/a/12830454

export default function precision(num, decimals = 2, op = Math.round) {
  const n = String(num)
  const index = n.indexOf("e")
  return (
    (index === -1
      ? op(`${n}e${decimals}`)
      : op(`${n.slice(0, index)}e${Number(n.slice(index + 1)) + decimals}`)) /
    Number(`1e${decimals}`) // [1]
  )
}

// [1] can't use (10 ** decimals) because chrome and firefox returns different results

export const round = (num, decimals = 2) => precision(num, decimals, Math.round)
export const floor = (num, decimals = 2) => precision(num, decimals, Math.floor)
export const ceil = (num, decimals = 2) => precision(num, decimals, Math.ceil)

precision.round = round
precision.floor = floor
precision.ceil = ceil
