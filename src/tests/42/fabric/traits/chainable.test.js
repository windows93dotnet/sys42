import test from "../../../../42/test.js"
import chainable from "../../../../42/fabric/traits/chainable.js"

// test("throw a TypeError if there is no argument", (t) => {
//   t.throws(() => chainable(), TypeError)
// })

// test("throw a TypeError if last argument is not a function", (t) => {
//   t.throws(() => chainable("derp"), TypeError)
// })

test("return function with context as first argument", (t) => {
  const fn = (ctx, arg1, arg2) => {
    t.alike(ctx.data, {})
    t.eq(ctx.entries, [])
    t.is(ctx.fn, fn)
    t.isFunction(ctx.call)
    t.is(arg1, 1)
    t.is(arg2, 2)
    return "ok"
  }

  const c = chainable(fn)
  t.is(c(1, 2), "ok")
})

test("return correct chain order", (t) => {
  const c = chainable(["x", "y"], ({ data }) => Object.keys(data))
  t.eq(c.x.y(), ["x", "y"])
  t.eq(c.y.x(), ["y", "x"])
})

test("return correct chain order", 2, (t) => {
  const c = chainable({ x: false, y: false }, ({ data }) => Object.keys(data))
  t.eq(c.x.y(), ["x", "y"])
  t.eq(c.y.x(), ["y", "x"])
})

test("keep properties in chain", (t) => {
  const c = chainable(["x", "y"], ({ data }) => Object.keys(data))
  c.foo = { bar: "baz" }
  t.eq(c.x.y(), ["x", "y"])
  t.eq(c.foo, { bar: "baz" })
  t.is(c.x.foo, c.foo)
  t.is(c.y.foo, c.foo)
  t.is(c.x.y.foo, c.foo)
})

test("save chain call in context object", (t) => {
  t.plan(4)
  let calls = 0
  const fn = ({ data }, arg) => {
    if (calls === 0) {
      t.alike(data, { foo: true })
      t.eq(arg, "bar")
    } else {
      t.alike(data, {
        foo: true,
        bar: true,
      })
      t.eq(arg, "baz")
    }

    calls++
  }

  const c = chainable(
    {
      foo: undefined,
      bar: undefined,
    },
    fn
  )

  c.foo("bar")
  c.foo.bar("baz")
})

test("properties other than `undefined` are always defined in context", (t) => {
  t.plan(4)
  let calls = 0
  const fn = ({ data }, arg) => {
    if (calls === 0) {
      t.alike(data, {
        foo: true,
        bar: false,
      })
      t.eq(arg, "bar")
    } else {
      t.alike(data, {
        foo: true,
        bar: true,
      })
      t.eq(arg, "baz")
    }

    calls++
  }

  const c = chainable(
    {
      foo: false,
      bar: false,
    },
    fn
  )

  c.foo("bar")
  c.foo.bar("baz")
})

test("accept array of `undefined` keys as argument", (t) => {
  t.plan(4)
  let calls = 0
  const fn = ({ data }, arg) => {
    if (calls === 0) {
      t.alike(data, { foo: true })
      t.eq(arg, "bar")
    } else {
      t.alike(data, {
        foo: true,
        bar: true,
      })
      t.eq(arg, "baz")
    }

    calls++
  }

  const c = chainable(["foo", "bar"], fn)

  c.foo("bar")
  c.foo.bar("baz")
})

test("merge `array` and `object` arguments", (t) => {
  t.plan(2)
  let calls = 0
  const fn = ({ data }) => {
    if (calls === 0) {
      t.alike(data, {
        derp: "default",
        foo: true,
      })
    } else {
      t.alike(data, {
        derp: true,
        foo: true,
      })
    }

    calls++
  }

  const c = chainable(["foo", "bar"], { derp: "default" }, fn)

  c.foo("bar")
  c.derp.foo("baz")
})

test("merge `array` and `object` arguments", 2, (t) => {
  t.plan(2)
  let calls = 0
  const fn = ({ data }) => {
    if (calls === 0) {
      t.alike(data, {
        derp: "default",
        foo: true,
      })
    } else {
      t.alike(data, {
        derp: true,
        foo: true,
      })
    }

    calls++
  }

  const c = chainable({ derp: "default" }, ["foo", "bar"], fn)

  c.foo("bar")
  c.derp.foo("baz")
})

test("first call always reset context", (t) => {
  const c = chainable(["nope", "foo", "bar"], ({ data }) => {
    t.alike(data, {
      foo: true,
      bar: true,
    })
  })

  c.nope // eslint-disable-line no-unused-expressions
  c.foo.bar("baz")
})

test("nested contexts don't merge", (t) => {
  t.plan(2)
  let calls = 0
  const fn = ({ data }) => {
    if (calls === 0) {
      t.alike(data, { bar: true })
    } else {
      t.alike(data, { foo: true })
    }

    calls++
  }

  const c = chainable(["foo", "bar"], fn)

  c.foo(c.bar())
})

test("throws on undefined calls", (t) => {
  t.plan(2 + 2 + 4)

  let calls = 0
  const c = chainable(["foo", "bar"], ({ data }) => {
    if (calls === 0) {
      t.alike(data, { foo: true })
    } else {
      t.alike(data, {
        foo: true,
        bar: true,
      })
    }

    calls++
  })

  c.foo()
  c.foo.bar()

  t.is(typeof c.foo, "function")
  t.is(typeof c.baz, "undefined")

  t.throws(() => c.baz(), TypeError)
  t.throws(() => c.foo.baz(), TypeError)
  t.throws(() => c.foo.baz.bar(), TypeError)
  t.throws(() => c.baz.bar(), TypeError)
})

test("chainable methods", (t) => {
  t.plan(6)
  const c = chainable(
    {
      foo(_, arg) {
        t.eq(arg, "hello")
      },
      bar({ data }, arg) {
        t.alike(data, {})
        t.eq(arg, 2)
      },
    },
    () => ""
  )

  t.is(typeof c.foo("hello"), "function")
  t.is(typeof c.foo("hello").bar(2), "function")
})

test("chainable methods", 2, (t) => {
  const c = chainable(
    {
      foo({ data }, arg) {
        data.foo = arg
      },
      bar({ data }, arg) {
        t.alike(data, { foo: "hello" })
        t.eq(arg, 2)
      },
    },
    () => ""
  )

  t.is(typeof c.foo("hello").bar(2), "function")
})

test("chainable methods", 3, (t) => {
  const foo = ({ data }, arg) => {
    data.foo = arg
  }

  const c = chainable(
    foo,
    function bar({ data }, arg) {
      t.alike(data, { foo: "hello" })
      t.eq(arg, 2)
    },
    () => ""
  )

  t.is(typeof c.foo("hello").bar(2), "function")
})

test("chainable method that return something not undefined end the chain", (t) => {
  const c = chainable(
    {
      foo({ data }, arg) {
        data.foo = arg
      },
      bar({ data }, arg) {
        return `${data.foo} number: ${arg}`
      },
    },
    () => ""
  )

  t.is(c.foo("hello").bar(2), "hello number: 2")
})

test("accept functions as arguments", (t) => {
  function main({ data }) {
    t.alike(data, {
      derp: "foo",
      foo: "derp",
    })
    return "ok"
  }

  function derp({ data }, arg) {
    t.eq(arg, "foo")
    data.derp = arg
  }

  const foo = ({ data }, arg) => {
    data.foo = arg
  }

  const c = chainable(derp, foo, main)
  t.is(c.derp("foo").foo("derp")(), "ok")
})

test("support caching multiple calls", (t) => {
  const c = chainable(["red", "green", "bold"], ({ data }) => data)
  const { red, green } = c
  const redBold = red.bold
  const greenBold = green.bold

  t.alike(red(), { red: true })
  t.alike(redBold(), {
    red: true,
    bold: true,
  })
  t.alike(green(), { green: true })
  t.alike(greenBold(), {
    green: true,
    bold: true,
  })
  t.alike(c(), {})
})
