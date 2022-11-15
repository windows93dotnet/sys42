/* eslint-disable max-params */
/* eslint-disable complexity */

//! Copyright (c) 2014 Szymon Witamborski. MIT License.
// @src http://brainshave.com/blog/tracing-pixels

const MOVES = {
  0b0001: { h: 1 },
  0b0010: { v: 1 },
  0b0011: { h: 1 },
  0b0100: { v: -1 },
  0b0101: { v: -1 },
  0b0110: { junction: 2 },
  0b0111: { v: -1 },
  0b1000: { h: -1 },
  0b1001: { junction: 1 },
  0b1010: { v: 1 },
  0b1011: { h: 1 },
  0b1100: { h: -1 },
  0b1101: { h: -1 },
  0b1110: { v: 1 },
}

const counterclockwise = (move) =>
  move.v === -1
    ? { h: -1 }
    : move.h === -1
    ? { v: 1 }
    : move.v === 1
    ? { h: 1 }
    : { v: -1 }

const isSameSig = (a, b) => a * b > 0

function optimize(moves) {
  const len = moves.length
  const out = []

  for (let i = 1, prev = moves[0]; i < len; ++i) {
    let current = moves[i]
    if (isSameSig(prev.h, current.h)) current = { h: prev.h + current.h }
    else if (isSameSig(prev.v, current.v)) current = { v: prev.v + current.v }
    else out.push(prev)
    prev = current
  }

  return out
}

const pathToString = (moves) =>
  moves
    .map((move) =>
      "h" in move
        ? "h" + move.h
        : "v" in move
        ? "v" + move.v
        : "M" + move.x + " " + move.y
    )
    .join("") + "z"

function tracePath(w, h, directions, visiteds, pixelHoles) {
  let x = 0
  let y = 0
  let hole

  // first check if any single pixel hole has been spotted
  main: for (y = 0; y < h; ++y) {
    for (x = 0; x < w; ++x) {
      if (directions[y][x] && pixelHoles[y][x]) {
        hole = pixelHoles[y][x]
        pixelHoles[y][x] = undefined
        break main
      }
    }
  }

  if (!hole) {
    // find starting point that hasn't been covered yet.
    main: for (y = 0; y < h; ++y) {
      for (x = 0; x < w; ++x) {
        if (directions[y][x] && !visiteds[y][x]) break main
      }
    }
  }

  if (x === w && y === h) return

  const startX = x
  const startY = y
  const moves = [{ x, y }]

  do {
    if (moves.length > 1000) throw new Error("Too many moves")

    let move = hole ? { h: -1 } : directions[y][x]
    hole = false

    if (move.junction) {
      if (x === startX && y === startY) {
        move = { h: -1 }
      } else {
        move = counterclockwise(moves[moves.length - 1])
        if (
          visiteds[y][x] !== true &&
          directions[y][x - 1].junction === 2 &&
          directions[y + 1][x].junction === 2
        ) {
          pixelHoles[y][x] = true
        }
      }
    }

    moves.push(move)
    visiteds[y][x] = true
    x += move.h | 0
    y += move.v | 0
  } while ((x === startX && y === startY) === false)

  return pathToString(optimize(moves))
}

function tracePaths({ data: d, width: w, height: h }) {
  const paths = []

  const directions = new Array(h)
  const visiteds = new Array(h)
  const pixelHoles = new Array(h)

  for (let y = 0; y <= h; ++y) {
    directions[y] = new Array(w)
    visiteds[y] = new Array(w)
    pixelHoles[y] = new Array(w)
    for (let x = 0; x <= w; ++x) {
      const code =
        ((y > 0 && x > 0 && d[((y - 1) * w + (x - 1)) * 4 + 3] ? 1 : 0) << 3) +
        ((y > 0 && x < w && d[((y - 1) * w + x) * 4 + 3] ? 1 : 0) << 2) +
        ((y < h && x > 0 && d[(y * w + (x - 1)) * 4 + 3] ? 1 : 0) << 1) +
        ((y < h && x < w && d[(y * w + x) * 4 + 3] ? 1 : 0) | 0)
      directions[y][x] = MOVES[code]
    }
  }

  let path

  do {
    if (paths.length > 1000) throw new Error("Too many path")
    path = tracePath(w, h, directions, visiteds, pixelHoles)
    if (path) paths.push(path)
  } while (path)

  return paths
}

export default function traceBitmap(imageData) {
  const paths = tracePaths(imageData)
  return {
    paths,
    get d() {
      return paths.join(" ")
    },
  }
}
