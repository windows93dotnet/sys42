import test from "../../42/test.js"
import ui from "../../42/ui.js"

import repaint from "../../42/fabric/type/promise/repaint.js"
import Component from "../../42/ui/class/Component.js"

const uppercase = (str) => str.toUpperCase()

await Component.define(
  class extends Component {
    static definition = {
      tag: "ui-t-component",
      class: "derp",
      props: {
        value: {
          type: "string",
        },
        foo: {
          type: "string",
          reflect: true,
        },
      },
    }

    customFilter(str) {
      return str.toUpperCase()
    }
  }
)

const elements = []
function div(connect = false) {
  const el = document.createElement("div")
  elements.push(el)
  if (connect) document.body.append(el)
  return el
}

function append(el) {
  elements.push(el)
  document.body.append(el)
}

test.afterEach(() => {
  for (const el of elements) el.remove()
  elements.length = 0
})

async function change(input, value) {
  input.value = value
  input.dispatchEvent(new Event("input", { bubbles: true }))
  await repaint()
}

function removeUid(html) {
  return html.replace(/(for|id)="([^"]+)"/g, '$1="uid"')
}

test.tasks(
  [
    {
      def: { type: "span#foo.bar" },
      expected: '<span id="foo" class="bar"></span>',
    },
    {
      def: { type: "span#foo.bar", id: "x" },
      expected: '<span id="x" class="bar"></span>',
    },
    {
      def: { type: "span#foo.bar", class: "baz" },
      expected: '<span class="baz bar" id="foo"></span>',
    },
    {
      def: { type: "checkbox#foo.bar", class: "baz" },
      expected:
        '<div class="check-cont"><input class="baz bar" id="foo" type="checkbox"></div>',
    },
    {
      def: { type: "ui-t-component#foo.bar", class: "baz" },
      expected: '<ui-t-component class="baz bar" id="foo"></ui-t-component>',
    },
  ],
  ({ def, expected }) => {
    test(`expand abbreviations`, def, async (t) => {
      const app = await ui(div(), def)
      t.is(app.el.innerHTML, expected)
    })
  }
)

test("template", async (t) => {
  const el = div()
  const app = await ui(el, `Hello {{world}}`)
  t.is(app.el.textContent, "Hello ")

  app.data.world = "World"
  await repaint()

  t.is(app.el.textContent, "Hello World")

  app.data = { world: "Derp" }
  await repaint()

  t.is(app.el.textContent, "Hello Derp")

  app.data = { world: 0 }
  await repaint()

  t.is(app.el.textContent, "Hello 0")

  app.data = { world: undefined }
  await repaint()

  t.is(app.el.textContent, "Hello ")
})

test("2-way data binding", async (t) => {
  const app = await ui(div(), [
    `Hello {{world}}`, //
    { type: "input", name: "world" },
  ])
  const text = app.el.firstChild
  const input = app.get("input")

  t.is(input.value, "")
  t.is(app.data.world, undefined)
  t.is(text.textContent, "Hello ")

  await change(input, "World")

  t.is(app.data.world, "World")
  t.is(text.textContent, "Hello World")

  app.data.world = "Derp"
  await repaint()

  t.is(input.value, "Derp")
  t.is(text.textContent, "Hello Derp")

  app.data = { world: "Foo" }
  await repaint()

  t.is(input.value, "Foo")
  t.is(text.textContent, "Hello Foo")

  await change(input, "Bar")

  t.is(app.data.world, "Bar")
  t.is(text.textContent, "Hello Bar")
})

test.skip("form control", async (t) => {
  const app = await ui(div(), [
    `Hello {{world}}`, //
    { type: "input", name: "world", value: "foo", label: false },
  ])

  const text = app.el.firstChild
  const input = app.get("input")

  // await repaint()

  t.is(input.value, "foo")
  t.is(app.data.world, "foo")
  t.is(text.textContent, "Hello foo")
})

test("data in definition", "Throws on non-object data", async (t) => {
  await t.throws(async () => {
    const app = await ui(div(), { content: "Oh, hi {{.}} !" })
    app.data = "Mark"
  }, TypeError)

  await t.throws(async () => {
    await ui(div(), { content: "Oh, hi {{.}} !", data: "Greg" })
  }, TypeError)
})

test("data in definition", "Object", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      `Oh, hi {{name}} !`, //
      { type: "input", name: "name" },
    ],
    data: { name: "Greg" },
  })

  const text = app.el.firstChild
  const input = app.get("input")

  t.is(input.value, "Greg")
  t.is(text.textContent, "Oh, hi Greg !")
  t.is(app.data.name, "Greg")

  await change(input, "Mark")

  t.is(input.value, "Mark")
  t.is(app.data.name, "Mark")
  t.is(text.textContent, "Oh, hi Mark !")
})

test("data in definition", "Array", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      content: [
        `- {{0}} -`, //
        { type: "input", name: "0" },
      ],
    },
    data: { arr: ["a"] },
  })

  t.eq(app.data.arr, ["a"])

  const text = app.el.firstChild

  const input = app.get("input")

  t.is(text.textContent, "- a -")
  t.is(input.value, "a")

  app.data.arr.length = 0
  await repaint()

  t.eq(app.data.arr, [])
  t.is(text.textContent, "-  -")
  t.is(input.value, "")

  app.data.arr.push("x")
  await repaint()

  t.eq(app.data.arr, ["x"])
  t.is(text.textContent, "- x -")
  t.is(input.value, "x")
})

test("scopes", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      "{{a}} - {{b.c.d}}",
      { type: "input", name: "b.c.d" },
      { type: "input", name: "a" },
      {
        scope: "b",
        content: [
          " + {{c.d}} & ",
          { type: "input", scope: "", name: "a" },
          { type: "input", name: "c.d" },
          {
            scope: "",
            content: [
              "{{a}} _ {{b.c.d}}", //
              { type: "input", name: "b.c.d" },
            ],
          },
        ],
      },
    ],
    data: {
      a: 1,
      b: {
        c: {
          d: 2,
        },
      },
    },
  })

  for (const item of app.getAll("label")) item.remove()

  t.is(app.el.textContent, "1 - 2 + 2 & 1 _ 2")

  app.data.a = "a"
  app.data.b.c.d = "d"
  await repaint()

  t.is(app.el.textContent, "a - d + d & a _ d")

  const inputs = app.getAll("input")

  t.eq(
    inputs.map(({ name }) => name),
    ["b.c.d", "a", "a", "b.c.d", "b.c.d"]
  )

  await change(inputs[0], "x")

  t.is(app.el.textContent, "a - x + x & a _ x")
  t.is(inputs[3].value, "x")
  t.is(inputs[4].value, "x")

  await change(inputs[1], "y")

  t.is(app.el.textContent, "y - x + x & y _ x")
  t.is(inputs[2].value, "y")
})

/* when
======= */

test("when", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [{ when: "a.b", content: "x" }],
    data: {
      a: { b: false },
    },
  })

  t.is(app.el.textContent, "")

  app.data.a.b = true
  await repaint()

  t.is(app.el.textContent, "x")

  app.data.a.b = false
  await repaint()

  t.is(app.el.textContent, "")
})

test("when", "array", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      content: [{ when: "0", content: "x" }],
    },
    data: {
      arr: [false],
    },
  })

  t.is(app.el.textContent, "")

  app.data.arr[0] = true
  await repaint()

  t.is(app.el.textContent, "x")

  app.data.arr[0] = false
  await repaint()

  t.is(app.el.textContent, "")
})

test("when", "else", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      { when: "a.b", content: "x" },
      { when: "!a.b", content: "y" },
    ],
    data: {
      a: { b: true },
    },
  })

  t.is(app.el.textContent, "x")

  app.data.a.b = false
  await repaint()

  t.is(app.el.textContent, "y")

  app.data.a.b = true
  await repaint()

  t.is(app.el.textContent, "x")
})

test("when", "else with empty content", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      { when: "a.b", content: "x" }, //
      { when: "!a.b", content: [] },
    ],
    data: {
      a: { b: true },
    },
  })

  t.is(app.el.textContent, "x")

  app.data.a.b = false
  await repaint()

  t.is(app.el.textContent, "")

  app.data.a.b = true
  await repaint()

  t.is(app.el.textContent, "x")
})

test("when", "nodes", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      {
        when: "a.b",
        content: [
          "x", //
          { type: "em", content: "y" },
        ],
      },
    ],
    data: {
      a: { b: false },
    },
  })

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[when]-->")

  app.data.a.b = true
  await repaint()

  t.is(app.el.textContent, "xy")
  t.is(app.el.innerHTML, "<!--[when]-->x<em>y</em>")

  app.data.a.b = false
  await repaint()

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[when]-->")
})

test("when", "element", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      {
        when: "a.b",
        type: "div",
        content: [
          "x", //
          { type: "em", content: "y" },
        ],
      },
    ],
    data: {
      a: { b: false },
    },
  })

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[when]-->")

  app.data.a.b = true
  await repaint()

  t.is(app.el.textContent, "xy")
  t.is(app.el.innerHTML, "<!--[when]--><div>x<em>y</em></div>")

  app.data.a.b = false
  await repaint()

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[when]-->")
})

/* repeat
========= */

test("repeat", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: { scope: "arr", repeat: "{{.}}" },
  })

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[repeat]-->")

  app.data.arr = [1, 2, 3]
  await repaint()

  t.is(app.el.textContent, "123")
  const childNodes = [...app.el.childNodes]
  t.is(childNodes[1].textContent, "1")

  app.data.arr.push(4)
  await repaint()

  t.is(app.el.textContent, "1234")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])
  t.is(childNodes[3], app.el.childNodes[3])

  app.data.arr.length = 2
  await repaint()

  t.is(app.el.textContent, "12")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])

  app.data.arr[0] = "a"
  await repaint()

  t.is(app.el.textContent, "a2")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])

  app.data.arr[1] = "b"
  await repaint()

  t.is(app.el.textContent, "ab")
  t.is(childNodes[1], app.el.childNodes[1])
  t.is(childNodes[2], app.el.childNodes[2])

  app.data.arr.length = 0
  await repaint()
  t.is(app.el.textContent, "")
})

test("repeat", "def", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      repeat: {
        type: "span",
        content: "{{.}}",
      },
    },
    data: { arr: ["a", "b"] },
  })

  t.is(app.el.textContent, "ab")
  t.is(
    app.el.innerHTML,
    "<!--[repeat]--><span>a</span><!--[#]--><span>b</span><!--[#]-->"
  )

  app.data.arr.push("c")
  await repaint()

  t.is(app.el.textContent, "abc")
  t.is(
    app.el.innerHTML,
    "<!--[repeat]--><span>a</span><!--[#]--><span>b</span><!--[#]--><span>c</span><!--[#]-->"
  )

  app.data.arr.length = 1
  await repaint()

  t.is(app.el.textContent, "a")
  t.is(app.el.innerHTML, "<!--[repeat]--><span>a</span><!--[#]-->")

  app.data.arr.length = 0
  await repaint()

  t.is(app.el.textContent, "")
  t.is(app.el.innerHTML, "<!--[repeat]-->")

  app.data.arr.push("x")
  await repaint()

  t.is(app.el.textContent, "x")
  t.is(app.el.innerHTML, "<!--[repeat]--><span>x</span><!--[#]-->")
})

test("repeat", "splice", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: { scope: "arr", repeat: "{{.}}" },
  })

  app.data.arr = [1, 2, 3]
  await repaint()

  t.is(app.el.textContent, "123")

  app.data.arr.splice(1, 1)
  await repaint()

  t.is(app.el.textContent, "13")
})

test("repeat", "array with objects", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      repeat: {
        type: "span",
        content: "{{x}}",
        class: "{{y}}",
      },
    },
    data: {
      arr: [
        { x: "A", y: "1" },
        { x: "B", y: "2" },
      ],
    },
  })

  t.is(
    app.el.innerHTML,
    '<!--[repeat]--><span class="1">A</span><!--[#]--><span class="2">B</span><!--[#]-->'
  )

  app.data.arr[0].x = "foo"
  await repaint()
  t.is(
    app.el.innerHTML,
    '<!--[repeat]--><span class="1">foo</span><!--[#]--><span class="2">B</span><!--[#]-->'
  )

  app.data.arr = [{ x: "Z", y: "9" }]
  await repaint()
  t.is(app.el.innerHTML, '<!--[repeat]--><span class="9">Z</span><!--[#]-->')
})

test("repeat", "div", "render index 0 bug", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      repeat: {
        type: "div",
        content: "{{path}}",
      },
    },
    data: {
      arr: [{ path: "A" }],
    },
  })

  await repaint()

  t.is(el.children.length, 1)
  t.is(el.textContent, "A")

  app.data.arr = [{ path: "Z" }]
  await repaint()

  t.is(el.children.length, 1)
  t.is(el.textContent, "Z")
  t.is(app.el.innerHTML, "<!--[repeat]--><div>Z</div><!--[#]-->")

  app.data.arr = [{ path: "X" }, { path: "Y" }]
  await repaint()

  t.is(
    app.el.innerHTML,
    "<!--[repeat]--><div>X</div><!--[#]--><div>Y</div><!--[#]-->"
  )
  t.is(el.children.length, 2)
  t.is(el.textContent, "XY")
})

test.skip("repeat", "ui-icon", "render index 0 bug", async (t) => {
  t.timeout(1000)
  const el = div(true)

  const app = await ui(el, {
    content: {
      scope: "arr",
      repeat: {
        type: "ui-icon",
        path: "{{path}}",
      },
    },
    data: {
      arr: [{ path: "A" }],
    },
  })

  await repaint()

  t.is(el.children.length, 1)
  t.is(el.textContent, "A")

  app.data.arr = [{ path: "Z" }]
  await repaint()

  t.is(el.children.length, 1)
  t.is(el.textContent, "Z")

  app.data.arr = [{ path: "X" }, { path: "Y" }]
  await repaint()

  t.is(el.children.length, 2)
  t.is(el.textContent, "XY")
})

test("repeat", "innerHTML", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      {
        scope: "arr",
        type: "ul",
        repeat: { type: "li", content: "{{.}}" },
      },
    ],
    data: { arr: [1, 2, 3] },
  })

  t.is(app.el.textContent, "123")
  t.is(
    app.el.innerHTML,
    "<ul><!--[repeat]--><li>1</li><!--[#]--><li>2</li><!--[#]--><li>3</li><!--[#]--></ul>"
  )

  app.data.arr.push(4)
  await repaint()

  t.is(app.el.textContent, "1234")
  t.is(
    app.el.innerHTML,
    "<ul><!--[repeat]--><li>1</li><!--[#]--><li>2</li><!--[#]--><li>3</li><!--[#]--><li>4</li><!--[#]--></ul>"
  )

  app.data.arr.length = 2
  await repaint()

  t.is(app.el.textContent, "12")
  t.is(
    app.el.innerHTML,
    "<ul><!--[repeat]--><li>1</li><!--[#]--><li>2</li><!--[#]--></ul>"
  )
})

test("repeat", "element", "scopped", async (t) => {
  const el = div()

  const app = await ui(el, {
    content: {
      type: "ul",
      scope: "a.b",
      repeat: { type: "li", content: "{{.}}" },
    },
    data: { a: { b: ["foo", "bar"] } },
  })

  t.is(
    app.el.innerHTML,
    "<ul><!--[repeat]--><li>foo</li><!--[#]--><li>bar</li><!--[#]--></ul>"
  )
  app.data.a.b.push("baz")
  await repaint()
  t.is(
    app.el.innerHTML,
    "<ul><!--[repeat]--><li>foo</li><!--[#]--><li>bar</li><!--[#]--><li>baz</li><!--[#]--></ul>"
  )
  app.data.a.b.length = 0
  // app.data.a.b = []
  await repaint()
  t.is(app.el.innerHTML, "<ul><!--[repeat]--></ul>")
})

test("repeat", "array of objects", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: { scope: "arr", repeat: "{{a}} - {{b}} - " },
    data: {
      arr: [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ],
    },
  })

  t.is(app.el.textContent, "1 - 2 - 3 - 4 - ")
})

test("repeat", "array of objects", "scopped", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: { scope: "arr", repeat: "{{a}} - {{b}} - " },
    data: {
      arr: [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ],
    },
  })

  t.is(app.el.innerHTML, "<!--[repeat]-->1 - 2 - <!--[#]-->3 - 4 - <!--[#]-->")
  t.is(app.el.textContent, "1 - 2 - 3 - 4 - ")

  app.data.arr.length = 1
  await repaint()

  t.is(app.el.innerHTML, "<!--[repeat]-->1 - 2 - <!--[#]-->")
  t.is(app.el.textContent, "1 - 2 - ")

  app.data.arr = undefined
  await repaint()

  t.is(app.el.innerHTML, "<!--[repeat]-->")
  t.is(app.el.textContent, "")

  app.data.arr = [{ a: "a", b: "b" }]
  await repaint()

  t.is(app.el.textContent, "a - b - ")

  app.data.arr[0].a = "x"
  delete app.data.arr[0].b
  await repaint()

  t.is(app.el.textContent, "x -  - ")

  delete app.data.arr
  await repaint()

  t.is(app.el.textContent, "")
})

test("repeat", "access root data", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: { scope: "arr", repeat: "{{a}} {{foo}} " },
    data: {
      foo: "bar",
      arr: [{ a: 1 }, { a: 2 }],
    },
  })

  t.is(app.el.textContent, "1 bar 2 bar ")
})

test("repeat", "access data in previous level", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: { scope: "baz.arr", repeat: "{{a}} {{foo}} {{x}} {{hello}} - " },
    data: {
      foo: "bar",
      x: "y",
      baz: {
        foo: "baz",
        hello: "world",
        arr: [{ a: 1, foo: "derp" }, { a: 2 }],
      },
    },
  })

  t.is(app.el.textContent, "1 derp y world - 2 baz y world - ")
})

test("repeat", "@parent & @root", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "baz.arr",
      repeat: "{{a}} {{foo}} {{@parent.foo}} {{@root.foo}} - ",
    },
    data: {
      foo: "bar",
      baz: {
        foo: "baz",
        arr: [{ a: 1, foo: "derp" }, { a: 2 }],
      },
    },
  })

  t.is(app.el.textContent, "1 derp baz bar - 2 baz baz bar - ")
})

test("repeat", "@index", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: { scope: "arr", repeat: "{{@index}} {{a}} " },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(app.el.textContent, "0 x 1 y ")
})

test("repeat", "#", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      repeat: ["{{#}} {{a}}\n", "{{##}} {{a}}\n", "{{###}} {{a}}\n"],
    },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(
    app.el.textContent,
    `\
0 x
00 x
000 x
1 y
01 y
001 y
`
  )
})

test("repeat", "@last", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: { scope: "arr", repeat: "{{##}} {{a}}{{@last ? '' : ', '}}" },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(app.el.textContent, "00 x, 01 y")
})

test("repeat", "@last element", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      repeat: ["{{@index}} {{a}}", { type: "br", when: "{{!@last}}" }],
    },
    data: {
      foo: "bar",
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(
    app.el.innerHTML,
    "<!--[repeat]-->0 x<!--[when]--><br><!--[#]-->1 y<!--[when]--><!--[#]-->"
  )
})

test("repeat", "input element", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      repeat: [{ type: "textarea", name: "a" }],
    },
    data: {
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  let ta = app.getAll("textarea")
  t.is(ta.length, 2)
  t.is(ta[0].name, "arr.0.a")
  t.is(ta[0].value, "x")
  t.is(ta[1].name, "arr.1.a")
  t.is(ta[1].value, "y")

  // app.data.arr.pop()
  app.data.arr = [{ a: "z" }]
  await repaint()

  ta = app.getAll("textarea")
  t.is(ta.length, 1)
  t.is(ta[0].name, "arr.0.a")
  t.is(ta[0].value, "z")
})

test("repeat", "lastChild bug", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      content: [{ repeat: [{ content: "{{a}}" }] }, { content: "z" }],
    },
    data: {
      arr: [{ a: "x" }, { a: "y" }],
    },
  })

  t.is(app.el.innerHTML, "<!--[repeat]-->x<!--[#]-->y<!--[#]-->z")

  app.data.arr.push({ a: "a" })
  await repaint()

  t.is(app.el.innerHTML, "<!--[repeat]-->x<!--[#]-->y<!--[#]-->a<!--[#]-->z")

  app.data.arr.length = 1
  await repaint()

  t.is(app.el.innerHTML, "<!--[repeat]-->x<!--[#]-->z")

  delete app.data.arr
  await repaint()

  t.is(app.el.innerHTML, "<!--[repeat]-->z")
})

test("repeat", "range bug", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      content: [
        { repeat: "{{a}}" }, //
        { content: "+" },
        { repeat: "{{a}}" },
      ],
    },

    data: {
      arr: [{ a: 1 }, { a: 2 }],
    },
  })

  t.is(
    app.el.innerHTML,
    "<!--[repeat]-->1<!--[#]-->2<!--[#]-->+<!--[repeat]-->1<!--[#]-->2<!--[#]-->"
  )

  app.data.arr.push({ a: 3 })
  await repaint()

  t.is(
    app.el.innerHTML,
    "<!--[repeat]-->1<!--[#]-->2<!--[#]-->3<!--[#]-->+<!--[repeat]-->1<!--[#]-->2<!--[#]-->3<!--[#]-->"
  )

  app.data.arr.length = 1
  await repaint()

  t.is(
    app.el.innerHTML,
    "<!--[repeat]-->1<!--[#]-->+<!--[repeat]-->1<!--[#]-->"
  )
})

/* actions
========== */

test("actions", async (t) => {
  const increment = t.stub()

  const app = await ui(div(), {
    content: { run: "increment" },
    actions: { increment },
  })

  const button = app.el.firstChild

  t.is(button.localName, "button")
  t.is(button.textContent, "Increment")
  t.is(increment.count, 0)

  button.click()
  t.isUndefined(increment.calls[0].args[0])
  t.is(increment.calls[0].thisArg, app.state.proxy)
  t.is(increment.count, 1)

  button.click()
  t.is(increment.count, 2)

  app.ctx.cancel()
  button.click()
  t.is(increment.count, 2)
})

test("actions", "args", async (t) => {
  const increment = t.stub()

  const app = await ui(div(), {
    content: { run: "increment", args: "a" },
    actions: { increment },
  })

  const button = app.el.firstChild

  button.click()

  t.is(increment.calls[0].args[0], "a")
  t.is(increment.calls[0].thisArg, app.state.proxy)
})

// TODO: test args template

test("actions", "direct function", async (t) => {
  const increment = t.stub(function increment() {})

  const app = await ui(div(), {
    content: { run: increment },
  })

  const button = app.el.firstChild

  t.is(button.textContent, "Increment")

  button.click()

  t.is(increment.calls[0].thisArg, app.state.proxy)
})

/* attributes
============= */

test("attributes", async (t) => {
  const app = await ui(div(), {
    content: { class: "foo", aria: { label: "foo" } },
  })

  t.is(app.el.innerHTML, '<div class="foo" aria-label="foo"></div>')
})

test("attributes using template", async (t) => {
  const app = await ui(div(), {
    content: { class: "{{a}}", aria: { label: "{{a}}" } },
    data: { a: "foo" },
  })

  t.is(app.el.innerHTML, '<div class="foo" aria-label="foo"></div>')

  app.data.a = "bar"
  await repaint()

  t.is(app.el.innerHTML, '<div class="bar" aria-label="bar"></div>')
})

test("attributes using watch", async (t) => {
  const app = await ui(div(), {
    content: { class: { watch: "a" }, aria: { label: { watch: "a" } } },
    data: { a: "foo" },
  })

  t.is(app.el.innerHTML, '<div class="foo" aria-label="foo"></div>')

  app.data.a = "bar"
  await repaint()

  t.is(app.el.innerHTML, '<div class="bar" aria-label="bar"></div>')
})

test("non-string aria attributes", async (t) => {
  const app = await ui(div(), {
    content: { aria: { disabled: { watch: "a" } } },
    data: { a: true },
  })

  t.is(app.el.innerHTML, '<div aria-disabled="true"></div>')

  app.data.a = false
  await repaint()

  t.is(app.el.innerHTML, '<div aria-disabled="false"></div>')

  app.data.a = undefined
  await repaint()

  t.is(app.el.innerHTML, "<div></div>")

  app.data.a = true
  await repaint()

  t.is(app.el.innerHTML, '<div aria-disabled="true"></div>')

  delete app.data.a
  await repaint()

  t.is(app.el.innerHTML, "<div></div>")
})

/* components
========== */

test.skip("components", "unknown", async (t) => {
  await t.throws(
    () => ui(div(), { type: "ui-unknown" }), //
    "Unknown component: ui-unknown"
  )
})

test(
  "components",
  "define properties and id/class as selector notation",
  async (t) => {
    await import("../../42/ui/components/swatch.js")

    const el = document.createElement("ui-swatch")

    t.is(el.outerHTML, "<ui-swatch></ui-swatch>")

    el.setAttribute("value", "red")

    append(el)

    t.is(
      el.outerHTML,
      '<ui-swatch value="red" style="--color:red;"></ui-swatch>'
    )
  }
)

test("components", "define properties via template", async (t) => {
  const app = await ui(div(), {
    type: "ui-swatch",
    value: "{{foo}}",
    data: { foo: "tan" },
  })

  document.body.append(app.el)

  await repaint()

  t.is(
    app.el.innerHTML,
    '<ui-swatch value="tan" style="--color:tan;"></ui-swatch>'
  )

  app.el.remove()
})

test("components", "filters", async (t) => {
  const app = await ui(div(), {
    type: "ui-t-component",
    value: "{{foo|customFilter}}",
    data: { foo: "hello" },
  })

  document.body.append(app.el)

  await repaint()

  t.is(app.el.firstChild.value, "HELLO")
  t.is(
    app.el.innerHTML,
    '<ui-t-component foo="hello" class="derp"></ui-t-component>'
  )

  app.el.remove()
})

test("components", "filters", "attribute defined by data", async (t) => {
  const app = await ui(div(), {
    type: "ui-t-component",
    foo: "{{foo|customFilter}}",
    data: { foo: "hello" },
  })

  document.body.append(app.el)

  await repaint()

  t.is(app.el.firstChild.foo, "HELLO")
  t.is(
    app.el.innerHTML,
    '<ui-t-component foo="HELLO" class="derp"></ui-t-component>'
  )

  app.el.remove()
})

/* filters
========== */

test("noop", async (t) => {
  const app = await ui(div(), {
    content: "a",
    data: { foo: "b" },
  })

  t.is(app.el.innerHTML, "a")
})

test("filters", async (t) => {
  const app = await ui(div(), {
    content: "a {{foo|uppercase}}",
    data: { foo: "b" },
    filters: { uppercase },
  })

  t.is(app.el.innerHTML, "a B")
})

test("filters", "inline variable", async (t) => {
  const app = await ui(div(), {
    content: "a {{'b'|uppercase}}",
    filters: { uppercase },
  })

  t.is(app.el.innerHTML, "a B")
})

test("filters", "as function", async (t) => {
  const app = await ui(div(), {
    content: "a {{uppercase(foo)}}",
    data: { foo: "b" },
    filters: { uppercase },
  })

  t.is(app.el.innerHTML, "a B")
})

test("filters", "thisArg", async (t) => {
  t.plan(2)
  const app = await ui(div(), {
    content: "a {{foo|uppercase}}",
    data: { foo: "b" },
    filters: {
      uppercase(str) {
        t.is(this.foo, "b")
        return str.toUpperCase()
      },
    },
  })

  t.is(app.el.innerHTML, "a B")
})

test("filters", "watch all locals", async (t) => {
  const app = await ui(div(), {
    content: "a {{foo|add(bar)}}",
    data: { foo: "b", bar: "c" },
    filters: {
      add: (one, two) => `${one} ${two}`,
    },
  })

  t.is(app.el.innerHTML, "a b c")

  app.data.foo = "x"
  await repaint()

  t.is(app.el.innerHTML, "a x c")

  app.data.bar = "y"
  await repaint()

  t.is(app.el.innerHTML, "a x y")
})

test("filters", "renderKeyVal", async (t) => {
  const app = await ui(div(), {
    content: {
      class: "{{foo|join}}",
    },
    data: { foo: ["x", "y"] },
    filters: {
      join: (arr) => arr.join(" "),
    },
  })

  t.is(app.el.innerHTML, '<div class="x y"></div>')

  app.data.foo.push("z")
  await repaint()

  t.is(app.el.innerHTML, '<div class="x y z"></div>')
})

test("filters", "renderKeyVal", "inline locals", async (t) => {
  const app = await ui(div(), {
    content: {
      class: '{{["x", "y"]|join}}',
    },
    filters: {
      join: (arr) => arr.join(" "),
    },
  })

  t.is(app.el.innerHTML, '<div class="x y"></div>')
})

test("filters", "async", async (t) => {
  const app = await ui(div(), {
    content: {
      class: '{{["x", "y"]|join}}',
    },
    filters: {
      async join(arr) {
        await t.sleep(200)
        return arr.join(" ")
      },
    },
  })

  t.is(app.el.innerHTML, '<div class="x y"></div>')
})

test("filters", "buildin filters", async (t) => {
  const app = await ui(div(), {
    type: "pre",
    content: "{{foo|stringify}}",
    data: { foo: { a: 1 } },
  })

  t.is(
    app.el.innerHTML,
    `\
<pre>{
  a: 1,
}</pre>`
  )
})

test("filters", "buildin filters locate", async (t) => {
  const app = await ui(div(), {
    type: "pre",
    content: "{{foo|stringify('min')}}",
    data: { foo: { a: 1 } },
  })

  t.is(app.el.innerHTML, "<pre>{a:1}</pre>")
})

test("filters", "pluralize", async (t) => {
  const app = await ui(div(), {
    content: "{{'apple'|pluralize}}, {{'orange'|pluralize(5)}}",
  })

  t.is(app.el.innerHTML, "apples, oranges")
})

// test("filters", "input", async (t) => {
//   const app = await ui(div(), {
//     type: "input",
//     name: "foo",
//     data: { foo: "foo" },
//     filters: {
//       uppercase: (str) => str.toUpperCase(),
//     },
//   })

//   t.eq(app.get("input").value, "foo")
// })

/* form element value
===================== */

test("input", async (t) => {
  const app = await ui(div(), {
    type: "input",
    name: "foo",
    data: { foo: "foo" },
  })

  t.eq(app.get("input").value, "foo")
})

test("textarea", async (t) => {
  const app = await ui(div(), {
    type: "textarea",
    name: "foo",
    data: { foo: "foo" },
  })

  t.eq(app.get("textarea").value, "foo")
})

test("select", async (t) => {
  const app = await ui(div(), {
    type: "select",
    name: "foo",
    content: ["derp", "foo"],
    data: { foo: "foo" },
  })

  t.eq(
    app.get("select").innerHTML,
    '<option label="derp" value="derp">derp</option><option label="foo" value="foo">foo</option>'
  )
  t.eq(app.get("select").value, "foo")
})

/* Content generation
===================== */

test("nested data", async (t) => {
  const app = await ui(div(), {
    content: [{ type: "div", content: [{ data: { a: 1 } }] }],
    data: { b: 2 },
  })

  t.eq(app.data, { b: 2, a: 1 })
})

test("nested data", "scopped", async (t) => {
  const app = await ui(div(), {
    content: [{ type: "div", content: [{ scope: "x", data: { a: 1 } }] }],
    data: { b: 2 },
  })

  t.eq(app.data, { b: 2, x: { a: 1 } })
})

test("content from schema", async (t) => {
  const app = await ui(div(), {
    schema: {
      type: "string",
    },
  })

  t.eq(app.ctx.global.schema, { type: "string" })
  t.eq(removeUid(app.el.innerHTML), '<input id="uid" autocomplete="off">')
})

test("content from schema", 2, async (t) => {
  const app = await ui(div(), {
    content: {
      type: "div",
      schema: {
        type: "string",
      },
    },
  })

  t.eq(app.ctx.global.schema, { type: "string" })
  t.eq(
    removeUid(app.el.innerHTML),
    '<div><input id="uid" autocomplete="off"></div>'
  )
})

test("content from schema ref", async (t) => {
  const app = await ui(div(), {
    content: {
      type: "div",
      schema: "#",
    },
    schema: {
      type: "string",
    },
  })

  t.eq(app.ctx.global.schema, { type: "string" })
  t.eq(
    removeUid(app.el.innerHTML),
    '<div><input id="uid" autocomplete="off"></div>'
  )
})

test("content from data", async (t) => {
  const app = await ui(div(), {
    data: { name: "Greg" },
  })

  t.is(
    removeUid(app.el.innerHTML),
    '<fieldset><div><label for="uid">Name</label><input id="uid" name="name" autocomplete="off"></div></fieldset>'
  )

  const input = app.get("input")

  t.is(input.value, "Greg")
  t.is(app.data.name, "Greg")

  app.data.name = "Mark"
  await repaint()

  t.is(input.value, "Mark")
  t.is(app.data.name, "Mark")

  await change(input, "x")
  t.is(app.data.name, "x")
})

test("schema", async (t) => {
  const app = await ui(div(), {
    type: "number",
    schema: {
      multipleOf: 2,
      required: true,
    },
  })

  t.is(
    removeUid(app.el.innerHTML),
    '<input id="uid" type="number" required="" step="2" autocomplete="off">'
  )
})

test("schema", 2, async (t) => {
  const app = await ui(div(), {
    content: {
      type: "number",
      schema: "properties.foo",
    },
    schema: {
      properties: {
        foo: {
          multipleOf: 2,
        },
      },
      required: ["foo"],
    },
  })

  t.is(
    removeUid(app.el.innerHTML),
    '<input id="uid" type="number" required="" step="2" autocomplete="off">'
  )
})

/* computed
=========== */

test("computed", async (t) => {
  t.plan(6)

  const app = await ui(div(), {
    content: {
      scope: "parsed",
      content: "foo: {{0}}, bar: {{1}}",
    },

    data: {
      formated: "FOO/BAR",
    },

    computed: {
      parsed: "{{formated|split('/')}}",
    },
  })

  const updates = ["formated", "parsed"]
  app.state.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  t.eq(app.data.parsed, ["FOO", "BAR"])
  t.eq(app.state.store.value, {
    formated: "FOO/BAR",
  })

  t.is(app.el.innerHTML, "foo: FOO, bar: BAR")

  app.data.formated = "HELLO/WORLD"
  await repaint()

  t.is(app.el.innerHTML, "foo: HELLO, bar: WORLD")
})

test("computed", "component", async (t) => {
  let cnt = 0

  await Component.define(
    class extends Component {
      static definition = {
        tag: "ui-t-computed",

        props: {
          formated: {
            type: "string",
          },
        },

        computed: {
          parsed: "{{formated|split('/')}}",
        },

        content: {
          scope: "parsed",
          content: "foo: {{0}}, bar: {{1}}",
        },
      }

      split(formated, sep) {
        cnt++
        return formated.split(sep)
      }
    }
  )

  const app = await ui(div(), {
    content: {
      type: "ui-t-computed",
      formated: "FOO/BAR",
    },
  })

  t.is(app.el.innerHTML, "<ui-t-computed>foo: FOO, bar: BAR</ui-t-computed>")
  t.is(cnt, 1)
  t.eq(app.data, {})
  t.eq(app.state.store.value, {})

  const updates = ["formated", "parsed"]
  app.state.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  t.is(app.el.innerHTML, "<ui-t-computed>foo: FOO, bar: BAR</ui-t-computed>")

  app.data.formated = "HELLO/WORLD"
  await repaint()

  t.is(
    app.el.innerHTML,
    "<ui-t-computed>foo: HELLO, bar: WORLD</ui-t-computed>"
  )
  t.is(cnt, 2)
  t.eq(app.data, { formated: "HELLO/WORLD" })
  t.eq(app.state.store.value, { formated: "HELLO/WORLD" })
})

test("computed", "component", async (t) => {
  let cnt = 0

  await Component.define(
    class extends Component {
      static definition = {
        tag: "ui-t-computed2",

        props: {
          formated: {
            type: "string",
          },
          parsed: {
            type: "string",
            computed: "{{formated|split('/')}}",
          },
        },

        content: {
          scope: "parsed",
          content: "foo: {{0}}, bar: {{1}}",
        },
      }

      split(formated, sep) {
        cnt++
        return formated.split(sep)
      }
    }
  )

  const app = await ui(div(), {
    content: {
      type: "ui-t-computed2",
      formated: "FOO/BAR",
    },
  })

  t.is(app.el.innerHTML, "<ui-t-computed2>foo: FOO, bar: BAR</ui-t-computed2>")
  t.is(cnt, 1)
  t.eq(app.data, {})
  t.eq(app.state.store.value, {})

  const updates = ["formated", "parsed"]
  app.state.on("update", (changes) => {
    t.is(updates.shift(), [...changes][0])
  })

  t.is(app.el.innerHTML, "<ui-t-computed2>foo: FOO, bar: BAR</ui-t-computed2>")

  app.data.formated = "HELLO/WORLD"
  await repaint()
  await repaint()

  t.is(
    app.el.innerHTML,
    "<ui-t-computed2>foo: HELLO, bar: WORLD</ui-t-computed2>"
  )
  t.is(cnt, 2)
  t.eq(app.data, { formated: "HELLO/WORLD" })
  t.eq(app.state.store.value, { formated: "HELLO/WORLD" })
})

/* components states
==================== */

test("components states", "separate state for each component", async (t) => {
  await Component.define({
    tag: "ui-t-cpn-state",
    props: {
      value: {
        type: "string",
        reflect: true,
      },
    },
    content: "value: {{value}} - ",
  })

  const app = await ui(div(), [
    {
      type: "ui-t-cpn-state",
      value: "x",
    },
    {
      type: "ui-t-cpn-state",
      value: "y",
    },
  ])

  document.body.append(app.el)

  await repaint()

  t.not(app.el.children[0], app.el.children[1])

  t.is(app.el.children[0].value, "x")
  t.is(app.el.children[0].getAttribute("value"), "x")
  t.is(app.el.children[1].value, "y")
  t.is(app.el.children[1].getAttribute("value"), "y")

  t.is(app.el.textContent, "value: x - value: y - ")

  app.el.remove()
})

await Component.define(
  class extends Component {
    static definition = {
      tag: "ui-t-repeat",

      props: {
        x: {
          type: "string",
        },
      },

      content: "x:{{x}}-",
    }
  }
)

test("components states", "component as source of truth", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      {
        type: "ui-t-repeat",
        x: "a",
      },
    ],
  })

  t.is(app.el.textContent, "x:a-")
  t.eq(app.data, {})

  app.get("ui-t-repeat").x = "A"
  await repaint()

  t.is(app.el.textContent, "x:A-")
  t.eq(app.data, {})

  app.data.x = "B"
  await repaint()

  t.is(app.el.textContent, "x:B-")
  t.eq(app.data, { x: "B" })
})

test("components states", "data as source of truth", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      {
        type: "ui-t-repeat",
        x: "{{foo}}",
      },
    ],

    data: {
      foo: "bar",
    },
  })

  t.is(app.el.textContent, "x:bar-")
  t.eq(app.data, { foo: "bar" })

  app.data.foo = "baz"
  await repaint()

  t.is(app.el.textContent, "x:baz-")
  t.eq(app.data, { foo: "baz" })
})

test("components states", "multiple scopes", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      {
        scope: "A",
        type: "ui-t-repeat",
        x: "a",
      },
      {
        scope: "B",
        type: "ui-t-repeat",
        x: "b",
      },
    ],
  })

  t.is(app.el.textContent, "x:a-x:b-")
  t.eq(app.data, { A: {}, B: {} })

  app.data.B.x = "B"
  await repaint()

  t.is(app.el.textContent, "x:a-x:B-")
  t.eq(app.data, { A: {}, B: { x: "B" } })
})

test("components states", "single scope", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: [
      {
        type: "ui-t-repeat#a",
        x: "a",
      },
      {
        type: "ui-t-repeat#b",
        x: "b",
      },
    ],
  })

  t.is(app.el.textContent, "x:a-x:b-")
  t.eq(app.data, {})

  app.get("#b").x = "B"
  await repaint()

  t.is(app.el.textContent, "x:a-x:B-")
  t.eq(app.data, {})

  app.data.x = "X"
  await repaint()

  t.is(app.el.textContent, "x:X-x:X-")
  t.eq(app.data, { x: "X" })
})

test("components states", "array data", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      repeat: {
        type: "ui-t-repeat",
        x: "{{foo}}",
      },
    },
    data: {
      arr: [
        { foo: "a" }, //
        { foo: "b" },
      ],
    },
  })

  t.is(app.el.textContent, "x:a-x:b-")
  t.eq(app.data, { arr: [{ foo: "a" }, { foo: "b" }] })

  app.data.arr[0].foo = "A"
  await repaint()

  t.is(app.el.textContent, "x:A-x:b-")
  t.eq(app.data, { arr: [{ foo: "A" }, { foo: "b" }] })

  app.data.x = "X"
  await repaint()

  t.is(app.el.textContent, "x:A-x:b-")
  t.eq(app.data, { arr: [{ foo: "A" }, { foo: "b" }], x: "X" })

  app.data.foo = "bar"
  await repaint()

  t.is(app.el.textContent, "x:A-x:b-")
  t.eq(app.data, { arr: [{ foo: "A" }, { foo: "b" }], x: "X", foo: "bar" })

  app.data.arr.length = 1
  await repaint()

  t.is(app.el.textContent, "x:A-")
  t.eq(app.data, { arr: [{ foo: "A" }], x: "X", foo: "bar" })
})

test("components states", "strings array", async (t) => {
  const el = div()
  const app = await ui(el, {
    content: {
      scope: "arr",
      repeat: {
        type: "ui-t-repeat",
        x: "{{.}}",
      },
    },
    data: {
      arr: [
        "a", //
        "b",
      ],
    },
  })

  t.is(app.el.textContent, "x:a-x:b-")
  // t.eq(app.data, { arr: [{ foo: "a" }, { foo: "b" }] })

  // app.data.arr[0].foo = "A"
  // await repaint()

  // t.is(app.el.textContent, "x:A-x:b-")
  // t.eq(app.data, { arr: [{ foo: "A" }, { foo: "b" }] })

  // app.data.x = "X"
  // await repaint()

  // t.is(app.el.textContent, "x:A-x:b-")
  // t.eq(app.data, { arr: [{ foo: "A" }, { foo: "b" }], x: "X" })

  // app.data.foo = "bar"
  // await repaint()

  // t.is(app.el.textContent, "x:A-x:b-")
  // t.eq(app.data, { arr: [{ foo: "A" }, { foo: "b" }], x: "X", foo: "bar" })

  // app.data.arr.length = 1
  // await repaint()

  // t.is(app.el.textContent, "x:A-")
  // t.eq(app.data, { arr: [{ foo: "A" }], x: "X", foo: "bar" })
})
