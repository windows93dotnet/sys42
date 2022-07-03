import test from "../../../../../42/test.js"
import mark from "../../../../../42/fabric/type/any/mark.js"

class Foo {}
class Bar {
  toString() {
    return "{bar}"
  }
}

const list = [
  { actual: undefined, expected: "undefined" },
  { actual: null, expected: "null" },
  { actual: false, expected: "false" },
  { actual: true, expected: "true" },
  { actual: 1, expected: "1" },
  { actual: 2, expected: "2" },
  { actual: "a", expected: '"a"' },
  { actual: /a/i, expected: "RegExp#/a/i" },
  { actual: Symbol("a"), expected: "Symbol(a)" },
  { actual: Symbol.for("a"), expected: "Symbol.for(a)" },
  { actual: BigInt("0x1fffffffffffff"), expected: "9007199254740991n" },
  { actual: (a) => a + 1, expected: "Function#(a) => a + 1" },
  { actual: [], expected: "[undefined]" },
  { actual: [1, 2], expected: "[1,2]" },
  { actual: [1, { a: 1 }], expected: "[1,{a:1}]" },
  { actual: {}, expected: "{}" },
  { actual: { a: 1 }, expected: "{a:1}" },
  { actual: { a: 1, b: { c: /a/i } }, expected: "{a:1,b:{c:RegExp#/a/i}}" },
  { actual: Object.create(null), expected: "{}" },
  { actual: test.utils.hashmap({ a: 1 }), expected: "{a:1}" },
  { actual: new Foo(), expected: "Foo#[object Object]" },
  { actual: new Bar(), expected: "Bar#{bar}" },
  { actual: new Map([["a", 1]]), expected: 'new Map([["a",1]])' },
  { actual: new Set(["a", 1]), expected: 'new Set(["a",1])' },
  {
    actual: new Uint8Array(3),
    expected: "new Uint8Array([0,0,0])",
  },
  {
    actual: new Uint8Array(100),
    startsWith:
      "new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,",
  },
  {
    actual: new TextEncoder().encode("foo").buffer,
    expected: "new Uint8Array([102,111,111]).buffer",
  },
  {
    actual: Math,
    startsWith: test.env.browser.isFirefox
      ? "{abs:Function#function abs() {\n    [native code]\n},acos:Function"
      : "{abs:Function#function abs() { [native code] },acos:Function#fun",
  },
]

if (globalThis.navigator) {
  list.push({
    actual: navigator,
    expected: "Navigator#[object Navigator]",
  })
}

if (globalThis.location) {
  list.push({
    actual: location,
    expected: `Location#${location.href}`,
  })
}

if (globalThis.File) {
  list.push(
    {
      actual: new File(["foo"], "a", { lastModified: 1 }),
      expected:
        'new File([],"a",{size:3,type:"",lastModified:1,webkitRelativePath:""})',
    },
    {
      actual: new File(["foo"], "b", { lastModified: 1, type: "text/plain" }),
      expected:
        'new File([],"b",{size:3,type:"text/plain",lastModified:1,webkitRelativePath:""})',
    }
  )
}

if (globalThis.Blob) {
  list.push({
    actual: new Blob(["foo"]),
    expected: 'new Blob([],{size:3,type:""})',
  })
}

if (globalThis.document) {
  let el = document.createElement("div")
  el.style = "color:tan"
  list.push({
    actual: el,
    expected: '<div style="color: tan;"></div>',
  })

  el = document.createElement("span")
  el.id = "foo"
  el.dataset.foo = "bar"
  list.push({
    actual: el,
    expected: '<span id="foo" data-foo="bar"></span>',
  })

  el = document.createElement("article")
  el.id = "very_very_long_id"
  el.append(document.createElement("section"))
  el.append(document.createElement("section"))
  el.append(document.createElement("section"))
  el.append(document.createElement("section"))
  list.push({
    actual: el,
    startsWith:
      '<article id="very_very_long_id"><section></section><section></se',
  })

  const ns = "http://www.w3.org/2000/svg"
  el = document.createElementNS(ns, "svg")
  el.id = "foo"
  el.dataset.foo = "bar"
  const rect = document.createElementNS(ns, "rect")
  rect.setAttributeNS(ns, "width", "100%")
  rect.setAttributeNS(ns, "height", "100%")
  rect.setAttributeNS(ns, "fill", "red")
  el.append(rect)

  list.push({
    actual: el,
    expected:
      '<svg id="foo" data-foo="bar"><rect width="100%" height="100%" fill="red"></rect></svg>',
  })
}

test.tasks(list, (test, { actual, expected, startsWith }) => {
  test(actual, (t) => {
    if (startsWith) {
      t.true(
        mark(actual).startsWith(startsWith),
        `don't starts with '${startsWith}'`
      )
    } else t.is(mark(actual), expected)
  })
})
