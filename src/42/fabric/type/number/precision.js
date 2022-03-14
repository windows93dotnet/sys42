// @src https://www.30secondsofcode.org/js/s/round
// TODO: pull request improvement

export const round = (num, precision = 2) =>
  Math.round(`${num}e${precision}`) / 10 ** precision

export const floor = (num, precision = 2) =>
  Math.floor(`${num}e${precision}`) / 10 ** precision

export const ceil = (num, precision = 2) =>
  Math.ceil(`${num}e${precision}`) / 10 ** precision

export default { round, floor, ceil }
