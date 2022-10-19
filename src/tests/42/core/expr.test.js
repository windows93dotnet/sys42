/* eslint-disable eqeqeq */

// @thanks https://github.com/Microsoft/vscode/blob/master/src/vs/platform/contextkey/test/common/contextkey.test.ts

import test from "../../../42/test.js"
import expr from "../../../42/core/expr.js"

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

const { task } = test

test.tasks(
  [
    task({ str: "{{a}}", res: targ.a }),
    task({ str: "{{!a}}", res: !targ.a }),
    task({ str: "{{a == 0}}", res: targ.a == 0 }),
    task({ str: "{{b == 1}}", res: targ.b == 1 }),
    task({ str: "{{b === 1}}", res: targ.b === 1 }),
    task({ str: "{{b > 0.5}}", res: targ.b > 0.5 }),
    task({ str: "{{b < 1.5}}", res: targ.b < 1.5 }),
    task({ str: "{{b < 1}}", res: targ.b < 1 }),
    task({ str: "{{b <= 1}}", res: targ.b <= 1 }),
    task({ str: "{{b == true}}", res: targ.b == true }),
    task({ str: "{{c == false}}", res: targ.c == false }),
    task({ str: "{{d == true}}", res: targ.d == true }),
    task({ str: "{{d === true}}", res: targ.d === true }),
    task({ str: "{{e == 'hello'}}", res: targ.e == "hello" }),
    task({ str: "{{e == 'Hello'}}", res: targ.e == "Hello" }),
    task({ str: '{{e == "hello"}}', res: targ.e == "hello" }),
    task({ str: '{{e == "Hello"}}', res: targ.e == "Hello" }),
    task({ str: "{{a}}", res: targ.a }),
    task({ str: "{{b}}", res: targ.b }),
    task({ str: "{{c}}", res: targ.c }),
    task({ str: "{{d}}", res: targ.d }),
    task({ str: "{{e}}", res: targ.e }),
    task({ str: "{{f}}", res: targ.f }),
    task({ str: "{{g}}", res: targ.g }),
    task({ str: "{{h}}", res: targ.h }),
    task({ str: "{{b && d}}", res: targ.b && targ.d }),
    task({ str: "{{b && !c}}", res: targ.b && !targ.c }),
    task({ str: "{{a && c && f}}", res: targ.a && targ.c && targ.f }),
    task({ str: "{{b && d && e}}", res: targ.b && targ.d && targ.e }),
    task({ str: "{{f > 10 && f <= 42}}", res: targ.f > 10 && targ.f <= 42 }),
    task({ str: "{{i.j.k === 1}}", res: targ.i.j.k === 1 }),
    task({ str: "{{i.l === 2}}", res: targ.i.l === 2 }),
    task({ str: "{{e =~ /^H(.*)o$/}}", res: /^H(.*)o$/.test(targ.e) }),
    task({ str: "{{e =~ /^h(.*)o$/}}", res: /^h(.*)o$/.test(targ.e) }),
    task({ str: "{{e =~ /^h(.*)o$/i}}", res: /^h(.*)o$/i.test(targ.e) }),
    task({ str: "{{d ? 'x' : 'y'}}", res: "x" }),
    task({ str: "{{d ? 0 : -1}}", res: 0 }),
    task({ str: "{{c ? 'x' : 'y'}}", res: "y" }),
    task({ str: "{{c ? 0 : -1}}", res: -1 }),
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
  // prettier-ignore
  [
    task({ str: "{{a += b}}", res: 5, expect: { a: 5, b: 3 } }),
    task({ str: "{{a -= b}}", res: -1, expect: { a: -1, b: 3 } }),
    task({ str: "{{b /= a}}", res: 1.5, expect: { a: 2, b: 1.5 } }),
    task({ str: "{{a *= b}}", res: 6, expect: { a: 6, b: 3 } }),
    task({ str: "{{a += 1}}", res: 3, expect: { a: 3, b: 3 } }),
    task({ str: "{{a++}}", res: 3, expect: { a: 3, b: 3 } }),
    task({ str: "{{a -= 1}}", res: 1, expect: { a: 1, b: 3 } }),
    task({ str: "{{a--}}", res: 1, expect: { a: 1, b: 3 } }),
    task({ str: "{{a += b; b = 10}}", res: 10, expect: { a: 5, b: 10 } }),
    task({ str: "{{b = 5; a += b}}", res: 7, expect: { a: 7, b: 5 } }),
    task({ str: "{{x = 5; a += x; b += x}}", res: 8, expect: { a: 7, b: 8, x: 5 } }),
    task({ str: '{{a = "x;y"; b = 5}}', res: 5, expect: { a: "x;y", b: 5 } }),
    task({ str: "{{a = a + 10}}", res: 12, expect: { a: 12, b: 3 } }),
    task({ str: "{{a = a > b ? b : 10}}", res: 10, expect: { a: 10, b: 3 } }),
    task({ str: "{{a = a < b ? b + 2 : 10}}", res: 5, expect: { a: 5, b: 3 } }),
    task({ str: "{{a = a < b - 1 ? 0 : b + 10}}", res: 13, expect: { a: 13, b: 3 } }),
    task({ str: "{{a = a == b - 1 ? 0 : b + 10}}", res: 0, expect: { a: 0, b: 3 } }),
    task({ str: "{{a ??= 42}}", res: 2, expect: { a: 2, b: 3 } }),
    task({ str: "{{a ??= 42}}", targ: { b: 3 }, res: 42, expect: { b: 3, a: 42 } }),
  ],

  (test, { targ, str, res, expect }) => {
    test("assignment", str, targ, (t) => {
      targ ??= { a: 2, b: 3 }

      t.throws(() => expr(targ, str), "Assignment not allowed")

      const out = expr(targ, str, { assignment: true })
      t.eq(targ, expect)
      if (res !== undefined) t.eq(out, res)
    })
  }
)

test.tasks(
  [
    task({
      str: "{{a = x()}}",
      targ: {
        a: 2,
        x: () => 5,
      },
      res: 5,
      expect: { a: 5 },
    }),
    task({
      str: "{{a = y()}}",
      targ: {
        a: 2,
        x: () => 5,
      },
      throws: TypeError,
    }),
    task({
      str: "{{a = y(a, 5)}}",
      targ: {
        a: 2,
        y: (a, b) => a + b,
      },
      res: 7,
      expect: { a: 7 },
    }),
    task({
      str: "{{a = x() |> y(5, 6)}}",
      targ: {
        a: 2,
        x: () => 5,
        y: (a, b) => a + b,
      },
      res: 11,
      expect: { a: 11 },
    }),
    task({
      str: "{{a = x() |> y(^^, 6)}}",
      targ: {
        a: 2,
        x: () => 5,
        y: (a, b) => a + b,
      },
      res: 11,
      expect: { a: 11 },
    }),
    task({
      str: "{{a = x() |> y(6, ^^)}}",
      targ: {
        a: 2,
        x: () => 5,
        y: (a, b) => a + b,
      },
      res: 11,
      expect: { a: 11 },
    }),
  ],

  (test, { targ, str, res, expect, throws }) => {
    test("actions", str, targ, (t) => {
      if (throws) {
        t.throws(() => expr(targ, str, { assignment: true }), throws)
        return
      }

      targ ??= { a: 2, b: 3 }

      const out = expr(targ, str, { assignment: true })
      t.eq(targ.a, expect.a)
      if (res !== undefined) t.eq(out, res)
    })
  }
)

test("multi locals", (t) => {
  const fn = expr.compile(expr.parse("{{a === b}}"))
  t.eq(fn({ a: 1 }, { b: 1 }), true)
  t.eq(fn({ a: 1 }, { b: 2 }), false)
})
