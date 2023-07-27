/* eslint-disable eqeqeq */

// @thanks https://github.com/Microsoft/vscode/blob/master/src/vs/platform/contextkey/test/common/contextkey.test.ts

import test from "../../../42/test.js"
import expr from "../../../42/core/expr.js"

const locals = {
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
  // prettier-ignore
  [
    task({ str: "{{a}}", res: locals.a }),
    task({ str: "{{!a}}", res: !locals.a }),
    task({ str: "{{a == 0}}", res: locals.a == 0 }),
    task({ str: "{{b == 1}}", res: locals.b == 1 }),
    task({ str: "{{b === 1}}", res: locals.b === 1 }),
    task({ str: "{{b > 0.5}}", res: locals.b > 0.5 }),
    task({ str: "{{b < 1.5}}", res: locals.b < 1.5 }),
    task({ str: "{{b < 1}}", res: locals.b < 1 }),
    task({ str: "{{b <= 1}}", res: locals.b <= 1 }),
    task({ str: "{{b == true}}", res: locals.b == true }),
    task({ str: "{{c == false}}", res: locals.c == false }),
    task({ str: "{{d == true}}", res: locals.d == true }),
    task({ str: "{{d === true}}", res: locals.d === true }),
    task({ str: "{{e == 'hello'}}", res: locals.e == "hello" }),
    task({ str: "{{e == 'Hello'}}", res: locals.e == "Hello" }),
    task({ str: '{{e == "hello"}}', res: locals.e == "hello" }),
    task({ str: '{{e == "Hello"}}', res: locals.e == "Hello" }),
    task({ str: "{{a}}", res: locals.a }),
    task({ str: "{{b}}", res: locals.b }),
    task({ str: "{{c}}", res: locals.c }),
    task({ str: "{{d}}", res: locals.d }),
    task({ str: "{{e}}", res: locals.e }),
    task({ str: "{{f}}", res: locals.f }),
    task({ str: "{{g}}", res: locals.g }),
    task({ str: "{{h}}", res: locals.h }),
    task({ str: "{{b && d}}", res: locals.b && locals.d }),
    task({ str: "{{b && !c}}", res: locals.b && !locals.c }),
    task({ str: "{{a && c && f}}", res: locals.a && locals.c && locals.f }),
    task({ str: "{{b && d && e}}", res: locals.b && locals.d && locals.e }),
    task({ str: "{{f > 10 && f <= 42}}", res: locals.f > 10 && locals.f <= 42 }),
    task({ str: "{{i.j.k === 1}}", res: locals.i.j.k === 1 }),
    task({ str: "{{i.l === 2}}", res: locals.i.l === 2 }),
    task({ str: "{{e =~ /^H(.*)o$/}}", res: /^H(.*)o$/.test(locals.e) }),
    task({ str: "{{e =~ /^h(.*)o$/}}", res: /^h(.*)o$/.test(locals.e) }),
    task({ str: "{{e =~ /^h(.*)o$/i}}", res: /^h(.*)o$/i.test(locals.e) }),
    task({ str: "{{d ? 'x' : 'y'}}", res: "x" }),
    task({ str: "{{d ? 0 : -1}}", res: 0 }),
    task({ str: "{{c ? 'x' : 'y'}}", res: "y" }),
    task({ str: "{{c ? 0 : -1}}", res: -1 }),
  ],

  (test, { str, res }) => {
    test(str, (t) => {
      t.is(expr(str, locals), res, str)
      t.is(expr.compile(expr.parse(str))(locals), res, str)
      t.is(expr.evaluate(str)(locals), res, str)
      t.is(expr.evaluate(str, { boolean: true })(locals), Boolean(res), str)
    })
  },
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
    task({ str: "{{a ??= 42}}", locals: { b: 3 }, res: 42, expect: { b: 3, a: 42 } }),
  ],

  (test, { locals, str, res, expect }) => {
    test("assignment", str, locals, (t) => {
      locals ??= { a: 2, b: 3 }

      t.throws(() => expr(str, locals), "Assignment not allowed")

      const out = expr(str, locals, { assignment: true })
      t.eq(locals, expect)
      if (res !== undefined) t.eq(out, res)
    })
  },
)

test.tasks(
  [
    task({
      str: "{{a = x()}}",
      locals: {
        a: 2,
        x: () => 5,
      },
      res: 5,
      expect: { a: 5 },
    }),
    task({
      str: "{{a = y()}}",
      locals: {
        a: 2,
        x: () => 5,
      },
      throws: TypeError,
    }),
    task({
      str: "{{a = y(a, 5)}}",
      locals: {
        a: 2,
        y: (a, b) => a + b,
      },
      res: 7,
      expect: { a: 7 },
    }),
    task({
      str: "{{a = x() |> y(5, 6)}}",
      locals: {
        a: 2,
        x: () => 5,
        y: (a, b) => a + b,
      },
      res: 11,
      expect: { a: 11 },
    }),
    task({
      str: "{{a = x() |> y(^^, 6)}}",
      locals: {
        a: 2,
        x: () => 5,
        y: (a, b) => a + b,
      },
      res: 11,
      expect: { a: 11 },
    }),
    task({
      str: "{{a = x() |> y(6, ^^)}}",
      locals: {
        a: 2,
        x: () => 5,
        y: (a, b) => a + b,
      },
      res: 11,
      expect: { a: 11 },
    }),
  ],

  (test, { locals, str, res, expect, throws }) => {
    test("actions", str, locals, (t) => {
      if (throws) {
        t.throws(() => expr(str, locals, { assignment: true }), throws)
        return
      }

      locals ??= { a: 2, b: 3 }

      const out = expr(str, locals, { assignment: true })
      t.eq(locals.a, expect.a)
      if (res !== undefined) t.eq(out, res)
    })
  },
)

test("multi locals", (t) => {
  const fn = expr.compile(expr.parse("{{a === b}}"))
  t.eq(fn({ a: 1 }, { b: 1 }), true)
  t.eq(fn({ a: 1 }, { b: 2 }), false)
})

test.flaky("async statements", async (t) => {
  const parsed = expr.parse("{{tmp = x(); a = tmp}}")

  const fn = expr.compile(parsed, { assignment: true, async: true })
  const locals = {
    a: 1,
    async x() {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(42)
        }, 10)
      })
    },
  }

  const res = await fn(locals)

  t.is(res, 42)
  t.eq(locals.a, 42)
  t.eq(locals.tmp, 42)
})
