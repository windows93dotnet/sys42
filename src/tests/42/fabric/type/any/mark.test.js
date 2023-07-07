import test from "../../../../../42/test.js"
import mark from "../../../../../42/fabric/type/any/mark.js"

class Foo {}
class Bar {
  toString() {
    return "{bar}"
  }
}

const { task } = test

const list = [
  task({ input: undefined, expected: "undefined" }),
  task({ input: null, expected: "null" }),
  task({ input: false, expected: "false" }),
  task({ input: true, expected: "true" }),
  task({ input: 0, expected: "+0" }),
  task({ input: -0, expected: "-0" }),
  task({ input: 1, expected: "1" }),
  task({ input: 2, expected: "2" }),
  task({ input: "a", expected: '"a"' }),
  task({ input: /a/i, expected: "RegExp#/a/i" }),
  task({ input: Symbol("a"), expected: "Symbol(a)" }),
  task({ input: Symbol.for("a"), expected: "Symbol.for(a)" }),
  task({ input: BigInt("0x1fffffffffffff"), expected: "9007199254740991n" }),
  task({ input: (a) => a + 1, expected: "Function#(a) => a + 1" }),
  task({ input: [], expected: "[undefined]" }),
  task({ input: [0, -0], expected: "[+0,-0]" }),
  task({ input: [1, 2], expected: "[1,2]" }),
  task({ input: [1, { a: 1 }], expected: "[1,{a:1}]" }),
  task({ input: {}, expected: "{}" }),
  task({ input: { a: 1 }, expected: "{a:1}" }),
  task({ input: { a: 0, b: -0 }, expected: "{a:+0,b:-0}" }),
  task({
    input: { a: 1, b: { c: /a/i } },
    expected: "{a:1,b:{c:RegExp#/a/i}}",
  }),
  task({ input: Object.create(null), expected: "{}" }),
  task({ input: test.utils.hashmap({ a: 1 }), expected: "{a:1}" }),
  task({ input: new Foo(), expected: "Foo#[object Object]" }),
  task({ input: new Bar(), expected: "Bar#{bar}" }),
  task({ input: new Map([["a", 1]]), expected: 'new Map([["a",1]])' }),
  task({ input: new Set(["a", 1]), expected: 'new Set(["a",1])' }),
  task({
    input: new Uint8Array(3),
    expected: "new Uint8Array([0,0,0])",
  }),
  task({
    input: new Uint8Array(100),
    startsWith:
      "new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,",
  }),
  task({
    input: new TextEncoder().encode("foo").buffer,
    expected: "new Uint8Array([102,111,111]).buffer",
  }),
  task({
    input: Math,
    startsWith: test.env.browser.isFirefox
      ? "{abs:Function#function abs() {\n    [native code]\n},acos:Function"
      : "{abs:Function#function abs() { [native code] },acos:Function#fun",
  }),
]

{
  const obj = { a: 1 }
  obj.b = obj
  list.push(
    task({
      input: obj,
      expected: "{a:1,b:↖}",
    }),
  )
}

if (globalThis.navigator) {
  list.push(
    task({
      input: navigator,
      expected: "Navigator#[object Navigator]",
    }),
  )
}

if (globalThis.location) {
  list.push(
    task({
      input: location,
      expected: `Location#${location.href}`,
    }),
  )
}

if (globalThis.File) {
  list.push(
    task({
      input: new File(["foo"], "a", { lastModified: 1 }),
      expected:
        'new File([],"a",{size:3,type:"",lastModified:1,webkitRelativePath:""})',
    }),
    task({
      input: new File(["foo"], "b", { lastModified: 1, type: "text/plain" }),
      expected:
        'new File([],"b",{size:3,type:"text/plain",lastModified:1,webkitRelativePath:""})',
    }),
  )
}

if (globalThis.Blob) {
  list.push(
    task({
      input: new Blob(["foo"]),
      expected: 'new Blob([],{size:3,type:""})',
    }),
  )
}

if (globalThis.document) {
  list.push(
    task({
      input: document.createTextNode("hello"),
      expected: "Text#hello",
    }),
    task({
      input: document.createComment("hello"),
      expected: "Comment#hello",
    }),
    task({
      input: document.createAttribute("hello"),
      expected: "Attr#hello",
    }),
    task({
      input: document.createDocumentFragment(),
      expected: "DocumentFragment##document-fragment",
    }),
  )

  let el = document.createElement("div")
  el.style = "color:tan"
  list.push(
    task({
      input: el,
      expected: '<div style="color: tan;"></div>',
    }),
  )

  el = document.createElement("span")
  el.id = "foo"
  el.dataset.foo = "bar"
  list.push(
    task({
      input: el,
      expected: '<span id="foo" data-foo="bar"></span>',
    }),
  )

  el = document.createElement("article")
  el.id = "very_very_long_id"
  el.append(document.createElement("section"))
  el.append(document.createElement("section"))
  el.append(document.createElement("section"))
  el.append(document.createElement("section"))
  list.push(
    task({
      input: el,
      startsWith:
        '<article id="very_very_long_id"><section></section><section></se',
    }),
  )

  const ns = "http://www.w3.org/2000/svg"
  el = document.createElementNS(ns, "svg")
  el.id = "foo"
  el.dataset.foo = "bar"
  const rect = document.createElementNS(ns, "rect")
  rect.setAttributeNS(ns, "width", "100%")
  rect.setAttributeNS(ns, "height", "100%")
  rect.setAttributeNS(ns, "fill", "red")
  el.append(rect)

  list.push(
    task({
      input: el,
      expected:
        '<svg id="foo" data-foo="bar"><rect width="100%" height="100%" fill="red"></rect></svg>',
    }),
  )
}

test.tasks(list, (test, { title, input, expected, startsWith }) => {
  test(title ?? input, (t) => {
    if (startsWith) {
      t.true(
        mark(input).startsWith(startsWith),
        `don't starts with '${startsWith}'`,
      )
    } else t.is(mark(input), expected)
  })
})
