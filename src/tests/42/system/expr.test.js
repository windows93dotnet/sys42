/* eslint-disable eqeqeq */

// @thanks https://github.com/Microsoft/vscode/blob/master/src/vs/platform/contextkey/test/common/contextkey.test.ts

import test from "../../../42/test.js"
import expr from "../../../42/system/expr.js"

const targ = {
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
    { str: "{{a}}", res: targ.a },
    { str: "{{!a}}", res: !targ.a },
    { str: "{{a == 0}}", res: targ.a == 0 },
    { str: "{{b == 1}}", res: targ.b == 1 },
    { str: "{{b === 1}}", res: targ.b === 1 },
    { str: "{{b > 0.5}}", res: targ.b > 0.5 },
    { str: "{{b < 1.5}}", res: targ.b < 1.5 },
    { str: "{{b < 1}}", res: targ.b < 1 },
    { str: "{{b <= 1}}", res: targ.b <= 1 },
    { str: "{{b == true}}", res: targ.b == true },
    { str: "{{c == false}}", res: targ.c == false },
    { str: "{{d == true}}", res: targ.d == true },
    { str: "{{d === true}}", res: targ.d === true },
    { str: "{{e == 'hello'}}", res: targ.e == "hello" },
    { str: "{{e == 'Hello'}}", res: targ.e == "Hello" },
    { str: '{{e == "hello"}}', res: targ.e == "hello" },
    { str: '{{e == "Hello"}}', res: targ.e == "Hello" },
    { str: "{{a}}", res: targ.a },
    { str: "{{b}}", res: targ.b },
    { str: "{{c}}", res: targ.c },
    { str: "{{d}}", res: targ.d },
    { str: "{{e}}", res: targ.e },
    { str: "{{f}}", res: targ.f },
    { str: "{{g}}", res: targ.g },
    { str: "{{h}}", res: targ.h },
    { str: "{{b && d}}", res: targ.b && targ.d },
    { str: "{{b && !c}}", res: targ.b && !targ.c },
    { str: "{{a && c && f}}", res: targ.a && targ.c && targ.f },
    { str: "{{b && d && e}}", res: targ.b && targ.d && targ.e },
    { str: "{{f > 10 && f <= 42}}", res: targ.f > 10 && targ.f <= 42 },
    { str: "{{i.j.k === 1}}", res: targ.i.j.k === 1 },
    { str: "{{i.l === 2}}", res: targ.i.l === 2 },
    { str: "{{e =~ /^H(.*)o$/}}", res: /^H(.*)o$/.test(targ.e) },
    { str: "{{e =~ /^h(.*)o$/}}", res: /^h(.*)o$/.test(targ.e) },
    { str: "{{e =~ /^h(.*)o$/i}}", res: /^h(.*)o$/i.test(targ.e) },
  ],

  (test, { str, res }) => {
    test(str, (t) => {
      t.is(expr(targ, str), res, str)
      t.is(expr.compile(expr.parse(str))(targ), res, str)
      t.is(expr.evaluate(str)(targ), res, str)
      t.is(expr.evaluate(str, { boolean: true })(targ), Boolean(res), str)
    })
  }
)

/* assignments
============== */

test.tasks(
  [
    { str: "{{a += b}}", res: 5, expec: { a: 5, b: 3 } },
    { str: "{{a -= b}}", res: -1, expec: { a: -1, b: 3 } },
    { str: "{{b /= a}}", res: 1.5, expec: { a: 2, b: 1.5 } },
    { str: "{{a *= b}}", res: 6, expec: { a: 6, b: 3 } },
    { str: "{{a += b; b = 10}}", res: 10, expec: { a: 5, b: 10 } },
    { str: "{{b = 5; a += b}}", res: 7, expec: { a: 7, b: 5 } },
    { str: "{{x = 5; a += x; b += x}}", res: 8, expec: { a: 7, b: 8, x: 5 } },
    { str: '{{a = "x;y"; b = 5}}', res: 5, expec: { a: "x;y", b: 5 } },
    { str: "{{a = a + 10}}", res: 12, expec: { a: 12, b: 3 } },
    { str: "{{a = a > b ? b : 10}}", res: 10, expec: { a: 10, b: 3 } },
    { str: "{{a = a < b ? b + 2 : 10}}", res: 5, expec: { a: 5, b: 3 } },
    { str: "{{a = a < b - 1 ? 0 : b + 10}}", res: 13, expec: { a: 13, b: 3 } },
    { str: "{{a = a == b - 1 ? 0 : b + 10}}", res: 0, expec: { a: 0, b: 3 } },
    { str: "{{a ??= 42}}", res: 2, expec: { a: 2, b: 3 } },
    { str: "{{a ??= 42}}", targ: { b: 3 }, res: 42, expec: { b: 3, a: 42 } },
  ],

  (test, { targ, str, res, expec }) => {
    test("assignment", str, targ, (t) => {
      targ ??= { a: 2, b: 3 }

      t.throws(() => expr(targ, str), "Assignment not allowed")

      const out = expr(targ, str, { assignment: true })
      t.eq(targ, expec)
      if (res !== undefined) t.eq(out, res)
    })
  }
)
