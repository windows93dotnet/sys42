// @src https://github.com/bgrins/TinyColor/blob/master/test/test.js

import test from "../../../../42/test.js"
import Color from "../../../../42/fabric/classes/Color.js"

test("original object is not modified", (t) => {
  // eslint-disable-next-line no-new
  new Color(t.stays({ h: 180, s: 0.5, l: 0.5 }))
})

test("validation", (t) => {
  const valids = [
    "#ff00aa",
    "ff00aa",
    "FF00AA",
    " ff00aa",
    "ff00aa ",
    "  ff00aa  ",
    "f0a",
    "#ff00aaff",
    "ff00aaff",
    "f0af",
    "#ff00aaf0",
    "ff00aaf0",
    "f0ae",
  ]

  const invalids = [
    "# ff00aa",
    "ff?0aa",
    "ff00ag",
    "ff00aaf",
    "ff00aaffff",
    "ff00aa&",
    "ff00aa#",
    "f0 a",
    "f0",
  ]

  valids.forEach((fixture) => {
    const c = new Color(fixture)
    t.true(c.valid, `"${fixture}" should be valid`)
  })

  invalids.forEach((fixture) => {
    const c = new Color(fixture)
    t.false(c.valid, `"${fixture}" should be invalid`)
  })
})

test("parse hex", (t) => {
  const valids = [
    ["ff01aa", 255, 1, 170, 1],
    ["f0a", 255, 0, 170, 1],
    ["F0A", 255, 0, 170, 1],
    ["fa9", 255, 170, 153, 1],
  ]

  valids.forEach(([fixture, r, g, b, a]) => {
    const c = new Color(fixture)
    t.is(c.r, r, `"${fixture}" r`)
    t.is(c.g, g, `"${fixture}" g`)
    t.is(c.b, b, `"${fixture}" b`)
    t.is(c.a, a, `"${fixture}" a`)
    t.is(c.valid, true, `"${fixture}" should be valid`)
  })
})

test("parse rgb3", (t) => {
  const valids = [
    ["rgb(255, 1, 170)", 255, 1, 170, 1],
    ["rgba(255, 1, 170, 0.5)", 255, 1, 170, 0.5],
    ["rgb(50%, 0%, 0%)", 128, 0, 0, 1],
    ["rgba(50%, 0%, 0%, .5)", 128, 0, 0, 0.5],
  ]

  valids.forEach(([fixture, r, g, b, a]) => {
    const c = new Color(fixture)
    t.is(c.r, r, `"${fixture}" r`)
    t.is(c.g, g, `"${fixture}" g`)
    t.is(c.b, b, `"${fixture}" b`)
    t.is(c.a, a, `"${fixture}" a`)
    t.is(c.valid, true, `"${fixture}" should be valid`)
  })
})

test("parse rgb4", (t) => {
  const valids = [
    ["rgb(255 1 170)", 255, 1, 170, 1],
    ["rgba(255 1 170 / 0.5)", 255, 1, 170, 0.5],
    ["rgb(50% 0% 0%)", 128, 0, 0, 1],
    ["rgba(50% 0% 0% / .5)", 128, 0, 0, 0.5],
  ]

  valids.forEach(([fixture, r, g, b, a]) => {
    const c = new Color(fixture)
    t.is(c.r, r, `"${fixture}" r`)
    t.is(c.g, g, `"${fixture}" g`)
    t.is(c.b, b, `"${fixture}" b`)
    t.is(c.a, a, `"${fixture}" a`)
    t.is(c.valid, true, `"${fixture}" should be valid`)
  })
})
