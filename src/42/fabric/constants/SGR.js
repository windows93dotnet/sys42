// @src https://github.com/chalk/ansi-styles
//! Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com). MIT License.
// @read https://en.wikipedia.org/wiki/ANSI_escape_code#SGR_(Select_Graphic_Rendition)_parameters
// @related https://github.com/sindresorhus/ansi-escapes/blob/master/index.js

import freeze from "../type/object/freeze.js"

export const STYLES = {
  reset: [0, 0],
  bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],
}

export const COLORS = {
  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
}

export const BRIGHT = {
  black: [90, 39],
  red: [91, 39],
  green: [92, 39],
  yellow: [93, 39],
  blue: [94, 39],
  magenta: [95, 39],
  cyan: [96, 39],
  white: [97, 39],
}

export const BG = {
  black: [40, 49],
  red: [41, 49],
  green: [42, 49],
  yellow: [43, 49],
  blue: [44, 49],
  magenta: [45, 49],
  cyan: [46, 49],
  white: [47, 49],
}

export const BG_BRIGHT = {
  black: [100, 49],
  red: [101, 49],
  green: [102, 49],
  yellow: [103, 49],
  blue: [104, 49],
  magenta: [105, 49],
  cyan: [106, 49],
  white: [107, 49],
}

STYLES.del = STYLES.strikethrough

COLORS.grey = BRIGHT.black
COLORS.gray = BRIGHT.black
BRIGHT.grey = BRIGHT.black
BRIGHT.gray = BRIGHT.black

BG.grey = BG_BRIGHT.black
BG.gray = BG_BRIGHT.black
BG_BRIGHT.grey = BG_BRIGHT.black
BG_BRIGHT.gray = BG_BRIGHT.black

export default freeze({
  STYLES,
  COLORS,
  BRIGHT,
  BG,
  BG_BRIGHT,
})
