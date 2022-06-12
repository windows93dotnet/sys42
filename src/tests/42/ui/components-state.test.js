import test from "../../../42/test.js"
import ui from "../../../42/ui.js"
import Component from "../../../42/ui/class/Component.js"

const elements = []
function tmp(connect = false) {
  const el = document.createElement("section")
  el.id = "component-tests"
  elements.push(el)
  if (connect) document.body.append(el)
  return el
}

test.teardown(() => {
  for (const el of elements) el.remove()
  elements.length = 0
})

Component.define({
  tag: "ui-t-state",

  props: {
    x: {
      type: "string",
    },
  },

  content: "x:{{x}}-",
})

Component.define({
  tag: "ui-t-nested-fixed",

  props: {
    array: {
      type: "array",
    },
  },

  content: {
    scope: "array",
    repeat: {
      tag: "ui-t-state",
      x: "fixed",
    },
  },
})

test("nested components", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-state",
      x: "foo",
    },
  })

  t.is(app.el.textContent, "x:foo-")
  t.eq(app.state.value, {
    "ui-t-state": {
      1: { x: "foo" },
    },
  })
})

test("nested components", "template", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-state",
      x: "{{y}}",
    },

    data: {
      y: "foo",
    },
  })

  t.eq(app.state.value, {
    "y": "foo",
    "ui-t-state": {
      1: { x: "foo" },
    },
  })
  t.is(app.el.textContent, "x:foo-")

  app.data.y = "bar"
  await app

  t.is(app.el.textContent, "x:bar-")
})

test("nested components", "multiple", async (t) => {
  const app = await ui(tmp(), {
    content: [
      {
        tag: "ui-t-state",
        x: "foo",
      },
      {
        tag: "ui-t-state",
        x: "bar",
      },
    ],
  })

  t.is(app.el.textContent, "x:foo-x:bar-")
  t.eq(app.state.value, {
    "ui-t-state": {
      1: { x: "foo" },
      2: { x: "bar" },
    },
  })
})

test("nested components", "scopped", async (t) => {
  const app = await ui(tmp(), {
    scope: "a",
    content: [
      {
        tag: "ui-t-state",
        x: "foo",
      },
      {
        tag: "ui-t-state",
        x: "bar",
      },
    ],
  })

  t.is(app.el.textContent, "x:foo-x:bar-")
  t.eq(app.state.value, {
    "ui-t-state": {
      1: { a: { x: "foo" } },
      2: { a: { x: "bar" } },
    },
  })
})

test("nested components", "fixed", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-nested-fixed",
      array: [
        { foo: "a" }, //
        { foo: "b" },
      ],
    },
  })

  t.is(app.el.textContent, "x:fixed-x:fixed-")
  t.eq(app.state.value, {
    "ui-t-nested-fixed": {
      1: { array: [{ foo: "a" }, { foo: "b" }] },
    },
    "ui-t-state": {
      1: {
        "ui-t-nested-fixed": {
          1: { array: { 0: { x: "fixed" }, 1: { x: "fixed" } } },
        },
      },
    },
  })
})

Component.define({
  tag: "ui-t-nested-dynamic",

  props: {
    array: {
      type: "array",
    },
  },

  content: {
    scope: "array",
    repeat: {
      tag: "ui-t-state",
      x: "{{foo}}",
    },
  },
})

test("nested components", "dynamic", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-nested-dynamic",
      array: [
        { foo: "a" }, //
        { foo: "b" },
      ],
    },
  })

  t.is(app.el.textContent, "x:a-x:b-")
  t.eq(app.state.value, {
    "ui-t-nested-dynamic": {
      1: { array: [{ foo: "a" }, { foo: "b" }] },
    },
    "ui-t-state": {
      1: {
        "ui-t-nested-dynamic": {
          1: { array: { 0: { x: "a" }, 1: { x: "b" } } },
        },
      },
    },
  })

  const el = app.get("ui-t-nested-dynamic")

  el.array.push({ foo: "c" })
  await app

  t.is(app.el.textContent, "x:a-x:b-x:c-")

  el.array = [{ foo: "A" }]
  await app

  t.is(app.el.textContent, "x:A-")

  el.array.push({ foo: "B" })
  await app

  t.is(app.el.textContent, "x:A-x:B-")

  el.array[0] = { foo: "foo" }
  await app

  t.is(app.el.textContent, "x:foo-x:B-")
})

Component.define({
  tag: "ui-t-nested-string-array",

  props: {
    array: {
      type: "array",
    },
  },

  content: {
    scope: "array",
    repeat: {
      tag: "ui-t-state",
      x: "{{.}}",
    },
  },
})

test("nested components", "string array", async (t) => {
  const app = await ui(tmp(), {
    content: {
      tag: "ui-t-nested-string-array",
      array: "{{arr}}",
    },

    data: {
      arr: [
        "a", //
        "b",
      ],
    },
  })

  t.is(app.el.textContent, "x:a-x:b-")

  app.data.arr = ["A"]
  await app

  t.is(app.el.textContent, "x:A-")

  app.data.arr.push("B")
  await app

  t.is(app.el.textContent, "x:A-x:B-")

  // app.data.arr[0] = "foo"
  // await app

  // t.is(app.el.textContent, "x:foo-x:B-")
})
