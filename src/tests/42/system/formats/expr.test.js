/* eslint-disable eqeqeq */

// @thanks https://github.com/Microsoft/vscode/blob/master/src/vs/platform/contextkey/test/common/contextkey.test.ts

import test from "../../../../42/test.js"
import expr from "../../../../42/system/formats/expr.js"

const target = {
  a: 0,
  b: 1,
  c: false,
  d: true,
  e: "Hello",
  f: 42,
  g: undefined,
  h: null,
  i: { j: { k: 1 }, l: 2 },
}

test.tasks(
  [
    { str: "a", res: Boolean(target.a) },
    { str: "!a", res: !target.a },
    { str: "a == 0", res: target.a == 0 },
    { str: "b == 1", res: target.b == 1 },
    { str: "b === 1", res: target.b === 1 },
    { str: "b > 0.5", res: target.b > 0.5 },
    { str: "b < 1.5", res: target.b < 1.5 },
    { str: "b < 1", res: target.b < 1 },
    { str: "b <= 1", res: target.b <= 1 },
    { str: "b == true", res: target.b == true },
    { str: "c == false", res: target.c == false },
    { str: "d == true", res: target.d == true },
    { str: "d === true", res: target.d === true },
    { str: "e == hello", res: target.e == "hello" },
    { str: "e == Hello", res: target.e == "Hello" },
    { str: "a", res: false },
    { str: "b", res: true },
    { str: "c", res: false },
    { str: "d", res: true },
    { str: "e", res: true },
    { str: "f", res: true },
    { str: "g", res: false },
    { str: "h", res: false },
    { str: "b && d", res: Boolean(target.b && target.d) },
    { str: "b && !c", res: Boolean(target.b && !target.c) },
    { str: "a && c && f", res: Boolean(target.a && target.c && target.f) },
    { str: "b && d && e", res: Boolean(target.b && target.d && target.e) },
    { str: "f > 10 && f <= 42", res: target.f > 10 && target.f <= 42 },
    { str: "e =~ /^H(.*)o$/", res: /^H(.*)o$/.test(target.e) },
    { str: "e =~ /^h(.*)o$/", res: /^h(.*)o$/.test(target.e) },
    { str: "e =~ /^h(.*)o$/i", res: /^h(.*)o$/i.test(target.e) },
    { str: "i.j.k === 1", res: target.i.j.k === 1 },
    { str: "i.l === 2", res: target.i.l === 2 },
  ],

  ({ str, res }) => {
    test(str, (t) => {
      t.is(expr(target, str), res, str)
      t.is(expr.compile(expr.parse(str))(target), res, str)
      t.is(expr.evaluate(str)(target), res, str)
    })
  }
)
