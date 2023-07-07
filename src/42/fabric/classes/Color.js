/* eslint-disable complexity */
/* eslint-disable max-depth */

//! Copyright (c), Brian Grinstead, http://briangrinstead.com. MIT License.
// @thanks https://github.com/bgrins/TinyColor

// @read https://colorjs.io

import COLOR_NAMES from "../constants/COLOR_NAMES.js"

const RGB_ORDER = ["r", "g", "b", "a"]
const HSL_ORDER = ["h", "s", "l", "a"]

const { round, min, max } = Math

const clamp = (x, lower, upper) => min(upper, max(lower, x))
const isPercentage = (str) => str.slice(-1) === "%"

const parseCssUnit = (val, key) => {
  const str = val[key]
  if (isPercentage(str)) {
    val[`${key}P`] = true
    return round((Number.parseFloat(str) / 100) * 255)
  }

  let num = Number.parseFloat(str)
  val[`${key}Int`] = Number.isInteger(num)
  if (Number.isNaN(num)) {
    val[`${key}NaN`] = true
    num = 0
  }

  return num
}

// TODO: write benchmark for rgbToHex
// @src https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb#comment6408455_5623914
// export const rgbToHex = (r, g, b) =>
//   ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).substr(1)

// @src https://www.30secondsofcode.org/js/s/rgb-to-hex
export const rgbToHex = (r, g, b) =>
  ((r << 16) + (g << 8) + b).toString(16).padStart(6, "0")

export class RGB {
  constructor(val) {
    if (typeof val.r === "string") val.r = parseCssUnit(val, "r")
    if (typeof val.g === "string") val.g = parseCssUnit(val, "g")
    if (typeof val.b === "string") val.b = parseCssUnit(val, "b")
    if (typeof val.a === "string") val.a = parseCssUnit(val, "a")
    if (val.rP === val.gP && val.gP === val.bP) val.valid = true
    if (val.rInt === val.gInt && val.gInt === val.bInt) val.valid = true
    if (val.rNaN || val.gNaN || val.bNaN) val.valid = false
    if (val.aNaN) {
      if (val.alphaShouldBeDefined) val.valid = false
      val.a = 1
    }

    this.valid = val.valid

    let { r = 0, g = 0, b = 0, a = 1 } = val

    if (r > 255) r = this.#invalidate(255)
    if (g > 255) g = this.#invalidate(255)
    if (b > 255) b = this.#invalidate(255)

    if (r < 0) r = this.#invalidate(0)
    if (g < 0) g = this.#invalidate(0)
    if (b < 0) b = this.#invalidate(0)

    if (a > 1) a = this.#invalidate(1)
    if (a < 0) a = this.#invalidate(0)

    this.r = r
    this.g = g
    this.b = b
    this.a = a
    this.name = val.name
  }

  #invalidate(correct) {
    this.valid = false
    return correct
  }
}

function preventNaN(val, alt = 1) {
  val = Number(val)
  return Number.isNaN(val) ? alt : val
}

export default class Color {
  #space = " "

  constructor(input = "", options) {
    this.config = { ...options }
    if (this.config.compact) this.#space = ""
    this.init(input)
  }

  init(val) {
    val =
      typeof val === "string" //
        ? new RGB(Color.parse(val))
        : new RGB({ ...val })
    this.r = val.r
    this.g = val.g
    this.b = val.b
    this.a = val.a
    this.valid = val.valid
    this.name = val.name
  }

  setAlpha(val) {
    this.a = clamp(preventNaN(val), 0, 1)
    return this
  }

  toString() {
    const { r, g, b, a } = this
    const _ = this.#space
    return `rgba(${r},${_}${g},${_}${b},${_}${a})`
  }

  toHex() {
    return `#${rgbToHex(this.r, this.g, this.b)}`
  }

  static parse(val) {
    val = val.toLowerCase().trim()
    const res = {
      r: "",
      g: "",
      b: "",
      a: "",
      valid: false,
    }

    if (COLOR_NAMES[val]) {
      res.valid = true
      res.name = val
      val = COLOR_NAMES[val]
      res.r = val[0]
      res.g = val[1]
      res.b = val[2]
      res.a = 1
      return res
    }

    let hexSyntax
    let funcSyntax
    let pushOrder = 0

    let cur = 0
    main: while (cur < val.length) {
      let code = val.charCodeAt(cur)

      if (code === 35 && cur === 0) code = val.charCodeAt(++cur) // #

      if (
        code === 114 && // r
        val.charCodeAt(cur + 1) === 103 && // g
        val.charCodeAt(cur + 2) === 98 // b
      ) {
        funcSyntax = RGB_ORDER
        cur += 2
        code = val.charCodeAt(cur)
      }

      if (
        code === 104 && // h
        val.charCodeAt(cur + 1) === 115 && // s
        val.charCodeAt(cur + 2) === 108 // l
      ) {
        funcSyntax = HSL_ORDER
        cur += 2
        code = val.charCodeAt(cur)
      }

      if (funcSyntax) {
        if (code === 97 /* a */) {
          res.alphaShouldBeDefined = true
          code = val.charCodeAt(++cur)
        }

        if (code === 40 /* ( */) {
          cur++
          let advanced = false
          while (cur < val.length) {
            code = val.charCodeAt(cur)
            if (code === 41 /* ) */) break main
            if (
              code === 32 /* " " */ ||
              code === 44 /* , */ ||
              code === 47 /* / */
            ) {
              if (!advanced) {
                advanced = true
                pushOrder++
              }

              cur++
              continue
            }

            if (funcSyntax[pushOrder]) {
              res[funcSyntax[pushOrder]] += val.charAt(cur++)
              advanced = false
              continue
            } else break main
          }
        }
      }

      // 0-9 || A-F
      if ((code > 47 && code < 58) || (code > 96 && code < 103)) {
        hexSyntax ??= []
        hexSyntax.push(val.charAt(cur++))
        continue
      }

      hexSyntax = undefined
      break
    }

    if (hexSyntax) {
      switch (hexSyntax.length) {
        case 3:
        case 4: {
          RGB_ORDER.forEach((key, i) => {
            if (hexSyntax[i]) {
              res[key] = Number.parseInt(`${hexSyntax[i]}${hexSyntax[i]}`, 16)
            }
          })
          if (res.a) res.a /= 255
          res.valid = true
          break
        }

        case 6:
        case 8: {
          let i = 0
          RGB_ORDER.forEach((key) => {
            if (hexSyntax[i + 1]) {
              res[key] = Number.parseInt(
                `${hexSyntax[i]}${hexSyntax[i + 1]}`,
                16,
              )
              i += 2
            }
          })
          if (res.a) res.a /= 255
          res.valid = true
          break
        }

        default:
      }
    }

    return res
  }
}
