// @src https://github.com/riot/observable/blob/master/test/specs/core.specs.js

import test from "../../../../42/test.js"

import emittable from "../../../../42/fabric/traits/emittable.js"
import Emitter from "../../../../42/fabric/class/Emitter.js"

test("emittable() return instance of Emitter", (t) => {
  const el = emittable()
  t.true(el instanceof Emitter)
})

test("public methods should not be enumerable", (t) => {
  let el = emittable()
  t.false(Object.propertyIsEnumerable.call(el, "on"))
  t.false(Object.propertyIsEnumerable.call(el, "off"))
  t.false(Object.propertyIsEnumerable.call(el, "once"))
  t.false(Object.propertyIsEnumerable.call(el, "emit"))
  t.false(Object.propertyIsEnumerable.call(el, "send"))

  el = emittable({})
  t.false(Object.propertyIsEnumerable.call(el, "on"))
  t.false(Object.propertyIsEnumerable.call(el, "off"))
  t.false(Object.propertyIsEnumerable.call(el, "once"))
  t.false(Object.propertyIsEnumerable.call(el, "emit"))
  t.false(Object.propertyIsEnumerable.call(el, "send"))
})

test("single listener", (t) => {
  const el = emittable()
  el.on("a", (arg) => {
    t.is(arg, true)
  })
  el.emit("a", true)
})

test("test with stub", (t) => {
  // TODO: rewrite more emittable tests using spy/stub
  const e = emittable()
  const s = t.stub()
  e.on("event", s)

  e.emit("event")
  t.is(s.calls.length, 1)
  t.is(s.count, 1)

  e.emit("event", "arg")
  t.is(s.calls[1].args[0], "arg")
})

test("use external object", (t) => {
  const el = {}
  emittable(el)
  el.on("a", (arg) => {
    t.is(arg, true)
  })
  el.emit("a", true)
})

test("listeners with special chars", (t) => {
  const el = emittable()
  let counter = 0
  const handler = function () {
    counter++
  }

  el.on("b/4", handler).on("c-d", handler).on("d:x", handler)

  el.once("d:x", (arg) => {
    t.is(arg, true)
  })

  el.emit("b/4").emit("c-d").emit("d:x", true)

  t.is(counter, 3)
})

test("once()", (t) => {
  t.plan(1)
  const el = emittable()
  let counter = 0
  el.once("g", () => {
    t.is(++counter, 1)
  })

  el.emit("g").emit("g")
})

test("once() & on()", (t) => {
  const el = emittable()
  let counter = 0
  el.once("y", () => {
    counter++
  })
    .on("y", () => {
      counter++
    })
    .emit("y")
    .emit("y")

  t.is(counter, 3)
})

test("once() & on() sharing the same handler", (t) => {
  const el = emittable()
  let counter = 0
  const handler1 = function () {
    counter++
  }

  const handler2 = function () {
    counter++
  }

  el.once("foo", handler1)
    .on("foo", handler2)
    .once("foo2", handler2)
    .on("foo2", handler1)

  el.emit("foo").emit("foo").emit("foo").emit("foo2").emit("foo2")

  t.is(counter, 7)
})

test("once() without handler return a promise", async (t) => {
  const el = emittable()

  t.isNotPromise(el.once("foo", () => {}))

  const p = el.once("bar")
  t.isPromise(p)
  el.emit("bar", 5)
  t.is(await p, 5)
})

test("send() return a promise that resolve when all handler are fulfilled", async (t) => {
  const el = emittable()
  el.on("*", async () => 10)
  el.on("bar", async () => 3)
  el.on("foo", async () => 5)
  el.on("foo", async () => {
    t.utils.sleep(5)
    return 4
  })

  t.eq(await el.send("foo"), [5, 4, 10])
})

test("remove listeners", (t) => {
  const el = emittable()
  let counter = 0

  function r() {
    t.is(++counter, 1)
  }

  el.on("r", r).on("s", r).off("s", r).emit("r").emit("s")
})

test("removes duplicate callbacks on off for specific handler", (t) => {
  const el = emittable()
  let counter = 0

  function func() {
    counter++
  }

  el.on("a1", func).on("a1", func).emit("a1").off("a1", func).emit("a1")

  t.is(counter, 2)
})

test("is able to emit events inside a listener", (t) => {
  const el = emittable()

  let e2 = false

  el.on("e1", () => {
    el.emit("e2")
  })
  el.on("e2", () => {
    e2 = true
  })

  el.emit("e1")

  t.is(e2, true)
})

test("listen all the events", (t) => {
  const el = emittable()
  let counter = 0

  function func(...args) {
    if (counter) {
      t.is(["b", "c"].includes(args[0]), true)
    } else {
      t.is(args[0], "a")
      t.is(args[1], "foo")
      t.is(args[2], "bar")
    }

    counter++
  }

  el.on("*", func)

  el.emit("a", "foo", "bar")
  el.emit("b")
  el.emit("c")

  t.is(counter, 3)
})

test("remove only the all listeners", (t) => {
  const el = emittable()
  let counter = 0

  function func() {
    counter++
  }

  function func2() {
    counter++
  }

  el.on("*", func)
    .on("*", func2)
    .on("foo", func)
    .off("*", func)
    .emit("foo")
    .off("*")
    .emit("foo")

  t.is(counter, 2)
})

test("listen all the events only once", (t) => {
  const el = emittable()
  let counter = 0

  function func(...args) {
    if (!counter) {
      t.is(args[0], "a")
      t.is(args[1], "foo")
      t.is(args[2], "bar")
    }

    counter++
  }

  el.once("*", func)

  el.emit("a", "foo", "bar")
  el.emit("b")
  el.emit("c")

  t.is(counter, 1)
})

test("multiple arguments", (t) => {
  const el = emittable()

  el.on("j", (a, b) => {
    t.is(a, 1)
    t.is(b[0], 2)
  })

  el.emit("j", 1, [2])
})

test("remove all listeners", (t) => {
  const el = emittable()
  let counter = 0

  function fn() {
    counter++
  }

  el.on("aa", fn).on("aa", fn).on("bb", fn)

  el.off("*")

  el.emit("aa bb")

  t.is(counter, 0)
})

test("remove specific listener", (t) => {
  const el = emittable()

  let once = 0
  let two = 0

  function fn() {
    once++
  }

  el.on("bb", fn).on("bb", () => {
    two++
  })

  el.emit("bb")
  el.off("bb", fn)
  el.emit("bb")

  t.is(once, 1)
  t.is(two, 2)
})

test("should not throw internal error", (t) => {
  const el = emittable()

  el.off("non-existing", test.noop)
  t.pass()
})

test("multi off", (t) => {
  const el = emittable()
  let counter = 0
  const fn = function () {
    counter++
  }

  el.on("foo", fn).on("bar", fn)
  el.off("foo bar", fn)
  el.emit("foo bar")
  t.is(counter, 0)
})

test("remove handler while emiting", (t) => {
  const el = emittable()
  let counter = 0

  function handler() {
    el.off("rem", handler)
  }

  el.on("rem", handler)

  el.on("rem", () => {
    counter++
  })

  el.on("rem", () => {
    counter++
  })

  el.emit("rem")

  t.is(counter, 2)
})

test("do not block callback throwing errors", (t) => {
  const el = emittable()
  let counter = 0

  el.on("event", () => {
    counter++
    throw new Error("boom")
  })
  el.on("event", () => {
    counter++
  })

  t.throws(() => {
    el.emit("event")
  })
  t.is(counter, 1)
})

test("the once event is called once also in a recursive function", (t) => {
  const el = emittable()
  let counter = 0
  el.once("event", () => {
    counter++
    el.once("event", () => {
      counter++
    })
  })
  el.emit("event")
  t.is(counter, 1)
  el.emit("event")
  t.is(counter, 2)
  el.emit("event")
  t.is(counter, 2)
})

test("repeat off: true", (t) => {
  const el = emittable()
  let counter = 0
  let off = el.on("event", { off: true }, () => {
    counter++
  })
  el.emit("event")
  t.is(counter, 1)
  off()
  el.emit("event")
  t.is(counter, 1)
  off = el.on("event", { off: true }, () => {
    counter++
  })
  el.emit("event")
  t.is(counter, 2)
  off()
  el.emit("event")
  t.is(counter, 2)
})
