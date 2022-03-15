import test from "../../../../../42/test.js"
import stringify from "../../../../../42/fabric/type/any/stringify.js"

import Callable from "../../../../../42/fabric/class/Callable.js"
// import resolve from "../../../42/type/json/resolve.js"

function stringToArrayBuffer(string) {
  return new TextEncoder().encode(string).buffer
}

function arrayBufferToString(arrayBuffer) {
  return new TextDecoder().decode(arrayBuffer)
}

test("boolean", (t) => {
  t.is(stringify(1 > 0), "true")
  t.is(stringify(true), "true")
  t.is(stringify(false), "false")
})

test("null", (t) => {
  t.is(stringify(null), "null")
})

test("undefined", (t) => {
  t.is(stringify(undefined), "undefined")
  t.is(stringify(void 0), "undefined")
  t.is(stringify(), "undefined")
})

test("number", (t) => {
  t.is(stringify(0), "0")
  t.is(stringify(-0), "-0")
  t.is(stringify(1), "1")
  t.is(stringify(-1), "-1")
  t.is(stringify(0.1), "0.1")
})

test("bigint", (t) => {
  const a = BigInt("0x1fffffffffffff")
  const b = 9_007_199_254_740_991n
  const expected = "9007199254740991n" // TODO: stringify with numeric separators
  t.is(stringify(a), expected)
  t.is(stringify(b), expected)
  t.is(stringify(BigInt(Number.MAX_SAFE_INTEGER)), expected)
})

test("string", (t) => {
  t.is(stringify(""), '""')
  t.is(stringify("a"), '"a"')
  t.is(stringify("ab"), '"ab"')
})

test("string with single quote", (t) => {
  const actual = stringify('a"b"c')
  t.is(actual, '"a\\"b\\"c"')
})

test("escaping characters", (t) => {
  const string = "a\n\tb💩"
  const actual = stringify(string, { escapeUnicode: true })
  t.is(actual, "`\\\na\n\\tb\\ud83d\\udca9`")
  t.is(eval(actual), string)
})

test("RegExp", (t) => {
  const actual = stringify(/a/gi)
  t.is(actual, "/a/gi")
})

test("Date", (t) => {
  const actual = stringify(new Date(Date.UTC(1961, 3, 12, 6, 7, 0)))
  t.is(actual, 'new Date("1961-04-12T06:07:00.000Z")')
})

test("NaN", (t) => {
  const actual = stringify(Number.NaN)
  t.is(actual, "NaN")
})

test("Infinity", (t) => {
  const actual = stringify(Infinity)
  t.is(actual, "Infinity")
})

test("-Infinity", (t) => {
  const actual = stringify(-Infinity)
  t.is(actual, "-Infinity")
})

test("constant numbers", (t) => {
  t.is(stringify(Number.MAX_VALUE), "Number.MAX_VALUE")
  t.is(stringify(Number.MIN_VALUE), "Number.MIN_VALUE")
  t.is(stringify(Number.MAX_SAFE_INTEGER), "Number.MAX_SAFE_INTEGER")
  t.is(stringify(Number.MIN_SAFE_INTEGER), "Number.MIN_SAFE_INTEGER")
  t.is(stringify(Number.EPSILON), "Number.EPSILON")

  if ("DEG_PER_RAD" in Math) {
    t.is(stringify(Math.DEG_PER_RAD), "Math.DEG_PER_RAD")
  }

  if ("RAD_PER_DEG" in Math) {
    t.is(stringify(Math.RAD_PER_DEG), "Math.RAD_PER_DEG")
  }

  t.is(stringify(Math.E), "Math.E")
  t.is(stringify(Math.LN2), "Math.LN2")
  t.is(stringify(Math.LN10), "Math.LN10")
  t.is(stringify(Math.LOG2E), "Math.LOG2E")
  t.is(stringify(Math.LOG10E), "Math.LOG10E")
  t.is(stringify(Math.PI), "Math.PI")
  t.is(stringify(3.141_592_653_589_793), "Math.PI")
  t.is(stringify(Math.SQRT1_2), "Math.SQRT1_2")
  t.is(stringify(Math.SQRT2), "Math.SQRT2")
})

/* function
=========== */

function noline() {}

test("function", "noline", (t) => {
  const actual = stringify(noline)
  t.is(
    actual,
    `\
function noline() {}`
  )
})

test("function", "noline", 2, (t) => {
  function noline() {}
  const actual = stringify(noline)
  t.is(
    actual,
    `\
function noline() {}`
  )
})

function singleLine(arg) {
  console.log(arg)
}

test("function", "singleLine", (t) => {
  const actual = stringify(singleLine)
  t.is(
    actual,
    `\
function singleLine(arg) {
  console.log(arg)
}`
  )
})

test("function", "singleLine", 2, (t) => {
  function singleLine2(arg) {
    console.log(arg)
  }

  const actual = stringify(singleLine2)
  t.is(
    actual,
    `\
function singleLine2(arg) {
  console.log(arg)
}`
  )
})

function multiLine(arg) {
  console.log(arg)
  console.log(arg)
}

test("function", "multiLine", (t) => {
  const actual = stringify(multiLine)
  t.is(
    actual,
    `\
function multiLine(arg) {
  console.log(arg)
  console.log(arg)
}`
  )
})

test("function", "multiLine", 2, (t) => {
  function multiLine2(arg) {
    console.log(arg)
    console.log(arg)
  }

  const actual = stringify(multiLine2)
  t.is(
    actual,
    `\
function multiLine2(arg) {
  console.log(arg)
  console.log(arg)
}`
  )
})

/*  */

test("function", 2, (t) => {
  function bar(arg) {
    console.log(arg)
  }

  const actual = stringify(bar)
  t.is(
    actual,
    `\
function bar(arg) {
  console.log(arg)
}`
  )
})

function foo2() {
  console.log(2)
}

foo2.derp = 1

test("function with properties", (t) => {
  const actual = stringify({ foo2 })
  t.is(
    actual,
    `\
{
  foo2: Object.assign(
    function foo2() {
      console.log(2)
    },
    {
      derp: 1,
    }
  ),
}`
  )
})

test("function with properties", 2, (t) => {
  function bar() {
    console.log(2)
  }

  bar.derp = 1

  const actual = stringify({ bar })
  t.is(
    actual,
    `\
{
  bar: Object.assign(
    function bar() {
      console.log(2)
    },
    {
      derp: 1,
    }
  ),
}`
  )
})

test("function with properties", (t) => {
  class Foo extends Callable {
    constructor() {
      super(() => {
        console.log(1)
      })
      this.bar = 2
    }

    baz() {
      console.log(3)
    }
  }

  const foo = new Foo()

  const actual = stringify({ foo })
  t.is(
    actual,
    `\
{
  foo: /* Foo */ Object.assign(
    () => {
      console.log(1)
    },
    {
      bar: 2,
    }
  ),
}`
  )
})

test("print native functions as valid javascript", (t) => {
  const actual = stringify(Array)
  t.is(actual, 'function Array() { "[native code]" }')
})

test("function in object", (t) => {
  const obj = {
    fun: function fun(arg) {
      console.log(arg)
    },
  }
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  fun: function fun(arg) {
    console.log(arg)
  },
}`
  )
})

test("function in object", 2, (t) => {
  const obj1 = {
    fun(arg) {
      console.log(arg)
    },
  }
  const obj2 = { x: obj1.fun }
  const actual = stringify(obj2)
  t.is(
    actual,
    `\
{
  x: function fun(arg) {
    console.log(arg)
  },
}`
  )
})

test("function in object", 3, (t) => {
  const obj = {
    fun(arg) {
      console.log(arg)
    },
  }
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  fun(arg) {
    console.log(arg)
  },
}`
  )
})

test("function in object", 4, (t) => {
  const obj = {
    fun(arg) {
      console.log(arg)
    },
  }
  obj.fun.derp = 1
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  fun: Object.assign(
    function fun(arg) {
      console.log(arg)
    },
    {
      derp: 1,
    }
  ),
}`
  )
})

test("function in object", 5, (t) => {
  const obj = {
    fun(arg) {
      console.log(arg)
    },
  }
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  fun(arg) {
    console.log(arg)
  },
}`
  )
})

test("function in object", 6, (t) => {
  const obj = {
    fun: (arg) => console.log(arg),
  }
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  fun: (arg) => console.log(arg),
}`
  )
})

test("function in object", 7, (t) => {
  const obj = {
    fun: () => console.log("a"),
  }
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  fun: () => console.log("a"),
}`
  )
})

test("deeply nested function", (t) => {
  // prettier-ignore
  const e = () => {
    console.log("e");
  };

  const obj = {
    a() {
      console.log("a")
    },
    b: {
      c() {
        console.log("c")
      },
      d: {
        e,
      },
    },
  }

  const actual = stringify(obj)

  t.is(
    actual,
    `\
{
  a() {
    console.log("a")
  },
  b: {
    c() {
      console.log("c")
    },
    d: {
      e: () => {
        console.log("e");
      },
    },
  },
}`
  )
})

test("tricky function indentation", (t) => {
  // prettier-ignore
  const getFn = () => arg => {
    console.log(arg)

    console.log("double newline")
  }

  const foo = {
    baz: () => (arg2) => {
      console.log(arg2)
    },
  }

  const str = stringify({
    a: getFn(),
    b: foo.baz(),
  })
  t.is(
    str,
    `\
{
  a: arg => {
    console.log(arg)

    console.log("double newline")
  },
  b: (arg2) => {
    console.log(arg2)
  },
}`
  )
})

test("function name", "force function name visibility", (t) => {
  const a = () => {
    console.log("a")
  }

  const obj2 = {
    b: a,
  }

  t.is(
    stringify(a),
    `\
/* a */ () => {
  console.log("a")
}`
  )

  t.is(
    stringify(obj2),
    `\
{
  b: /* a */ () => {
    console.log("a")
  },
}`
  )
})

test(
  "function name",
  "force function name visibility",
  "addComments: false",
  (t) => {
    const a = () => {
      console.log("a")
    }

    const obj2 = {
      b: a,
    }

    t.is(
      stringify(a, { addComments: false }),
      `\
() => {
  console.log("a")
}`
    )

    t.is(
      stringify(obj2, { addComments: false }),
      `\
{
  b: () => {
    console.log("a")
  },
}`
    )
  }
)

test("class name", "force class name visibility", (t) => {
  const a = class {
    constructor() {
      console.log("a")
    }
  }
  const obj2 = {
    b: a,
  }

  t.is(
    stringify(a),
    `\
/* a */ class {
  constructor() {
    console.log("a")
  }
}`
  )

  t.is(
    stringify(obj2),
    `\
{
  b: /* a */ class {
    constructor() {
      console.log("a")
    }
  },
}`
  )
})
test("class name", "force class name visibility", "addComments: false", (t) => {
  const a = class {
    constructor() {
      console.log("a")
    }
  }
  const obj2 = {
    b: a,
  }

  t.is(
    stringify(a, { addComments: false }),
    `\
class {
  constructor() {
    console.log("a")
  }
}`
  )

  t.is(
    stringify(obj2, { addComments: false }),
    `\
{
  b: class {
    constructor() {
      console.log("a")
    }
  },
}`
  )
})

test("function name", "don't display function name twice", (t) => {
  function a() {
    console.log("a")
  }

  const obj1 = {
    b: a,
  }

  const actual = stringify(obj1)

  t.is(
    actual,
    `\
{
  b: function a() {
    console.log("a")
  },
}`
  )

  t.not(
    actual,
    `\
{
  b: /* a */ function a() {
    console.log("a")
  },
}`
  )
})

test("class name", "don't display class name twice", (t) => {
  class A {
    constructor() {
      console.log("a")
    }
  }
  const obj1 = {
    b: A,
  }

  const actual = stringify(obj1)

  t.is(
    actual,
    `\
{
  b: class A {
    constructor() {
      console.log("a")
    }
  },
}`
  )

  t.not(
    actual,
    `\
{
  b: /* A */ class A {
    constructor() {
      console.log("a")
    }
  },
}`
  )
})

test("function name", "object transfer", (t) => {
  const obj1 = {
    a: () => console.log("a"),
  }
  const obj2 = {
    b: obj1.a,
  }

  t.is(
    stringify(obj1),
    `\
{
  a: () => console.log("a"),
}`
  )

  t.is(
    stringify(obj2),
    `\
{
  b: /* a */ () => console.log("a"),
}`
  )
})

test("function name", "object transfer", "addComments: false", (t) => {
  const obj1 = {
    a: () => console.log("a"),
  }
  const obj2 = {
    b: obj1.a,
  }

  t.is(
    stringify(obj2, { addComments: false }),
    `\
{
  b: () => console.log("a"),
}`
  )
})

test("function name", "object transfer", "function propertie shortcut", (t) => {
  const obj1 = {
    a() {
      console.log("a")
    },
  }

  const obj2 = {
    b: obj1.a,
  }

  const actual = stringify(obj2)

  t.is(
    actual,
    `\
{
  b: function a() {
    console.log("a")
  },
}`
  )

  t.not(
    actual,
    `\
{
  b: a() {
    console.log("a")
  },
}`
  )
})

test("function name", "anonymous should not be visible", (t) => {
  const obj = {
    a: (() =>
      function () {
        console.log("a")
      })(),
  }

  const actual = stringify(obj)

  t.not(
    actual,
    `\
{
  a: /*  */ function() {
    console.log("a")
  },
}`
  )

  t.is(
    actual,
    `\
{
  a: function () {
    console.log("a")
  },
}`
  )
})

/* arrays
========= */

test("array", (t) => {
  const actual = stringify([1, 2])
  t.is(
    actual,
    `\
[
  1,
  2,
]`
  )
})

test("empty array", (t) => {
  t.is(stringify([]), "[]")
})

test("sparse array", (t) => {
  t.is(stringify([, ,]), "new Array(2)")
  t.is(stringify.line([, , undefined]), "[ , , undefined ]")
  t.is(stringify.line([undefined, undefined]), "[ undefined, undefined ]")
})

test("initialized array", (t) => {
  const arr1 = new Array(5, 2, undefined)
  const arr2 = new Array(3)
  const arr3 = new Array()

  const options = { newline: "", indentSpace: "", lastComma: "" }

  t.is(stringify(arr1, options), "[5,2,undefined]")
  t.is(stringify(arr2, options), "new Array(3)")
  t.is(stringify(arr3, options), "[]")
})

test("array without trailing lastComma", (t) => {
  const str = stringify([1, 2], { lastComma: "" })
  t.is(
    str,
    `\
[
  1,
  2
]`
  )
})

test("array on one line", (t) => {
  const actual = stringify([1, 2], {
    newline: " ",
    indentSpace: "",
    lastComma: "",
  })
  t.is(actual, "[ 1, 2 ]")
})

test("custom array", (t) => {
  class Foo extends Array {
    constructor(...args) {
      super(...args)
      this.baz = 1
    }
  }
  const actual = stringify(new Foo(1, 2))
  t.is(
    actual,
    `\
/* Foo */ [
  1,
  2,
]`
  )
})

test("initialized custom array", (t) => {
  class Foo extends Array {}
  const arr1 = new Foo(5, 2, undefined)
  const arr2 = new Foo(3)
  const arr3 = new Foo()

  const options = { newline: "", indentSpace: "", lastComma: "" }

  t.is(stringify(arr1, options), "/* Foo */ [5,2,undefined]")
  t.is(stringify(arr2, options), "new Foo(3)")
  t.is(stringify(arr3, options), "/* Foo */ []")
})

/* objects
========== */

test("object", (t) => {
  const actual = stringify({ foo: "derp" })
  t.is(
    actual,
    `\
{
  foo: "derp",
}`
  )
})

test("object empty", (t) => {
  const actual = stringify({})
  t.is(actual, "{}")
})

test("key with and without quotes", (t) => {
  const actual = stringify({
    "a": 1,
    "0": 1,
    "42": 1,
    "a42": 1,
    "_": 1,
    "_a": 1,
    "a_": 1,
    "$": 1,
    "$a": 1,
    "a$": 1,
    // with quotes
    "42a": 1,
    "é": 1,
    "😁": 1,
  })
  t.is(
    actual,
    `\
{
  0: 1,
  42: 1,
  a: 1,
  a42: 1,
  _: 1,
  _a: 1,
  a_: 1,
  $: 1,
  $a: 1,
  a$: 1,
  "42a": 1,
  "é": 1,
  "😁": 1,
}`
  )
})

test("object with empty key", (t) => {
  const actual = stringify({
    "": 1,
  })
  t.is(
    actual,
    `\
{
  "": 1,
}`
  )
})

test("object with falsy key", (t) => {
  const actual = stringify({
    0: 1,
  })
  t.is(
    actual,
    `\
{
  0: 1,
}`
  )
})

test("object with Inherited Enumerable", (t) => {
  const obj = Object.create({ a: 1 })
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  a: 1,
}`
  )
})

test("object with getter", (t) => {
  const obj = {}
  Object.defineProperties(obj, {
    a: {
      enumerable: true,
      get: () => 1,
    },
  })
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  a: 1,
}`
  )
})

test("object with Nonenumerable", (t) => {
  const obj = {}
  Object.defineProperties(obj, {
    a: {
      enumerable: false,
      get: () => 1,
    },
  })
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  a: 1,
}`
  )
})

test("Object.create(null)", (t) => {
  t.is(stringify(Object.create(null)), "Object.create(null)")
  t.is(stringify(Object.create(null), { traceNullProto: false }), "{}")
})

test("Object.create(null) as dict", (t) => {
  const dict = Object.create(null)
  dict.a = 1
  dict.b = 2

  t.is(
    stringify(dict),
    `\
Object.assign(Object.create(null), {
  a: 1,
  b: 2,
})`
  )

  t.is(
    stringify(dict, { traceNullProto: false }),
    `\
{
  a: 1,
  b: 2,
}`
  )
})

test("Object.create(null)", (t) => {
  const actual = stringify(Object.create(null))
  t.is(actual, "Object.create(null)")
})

test("Object.create(null)", "traceNullProto: false", (t) => {
  const actual = stringify(Object.create(null), { traceNullProto: false })
  t.is(actual, "{}")
})

test("Object.create(null) as dict", (t) => {
  const dict = Object.create(null)
  dict.a = 1
  dict.b = 2
  const actual = stringify(dict)
  t.is(
    actual,
    `\
Object.assign(Object.create(null), {
  a: 1,
  b: 2,
})`
  )
})

test("Object.create(null) as dict", "traceNullProto: false", (t) => {
  const dict = Object.create(null)
  dict.a = 1
  dict.b = 2
  const actual = stringify(dict, { traceNullProto: false })
  t.is(
    actual,
    `\
{
  a: 1,
  b: 2,
}`
  )
})

test("object without trailing lastComma", (t) => {
  const actual = stringify({ a: "b" }, { lastComma: "" })
  t.is(
    actual,
    `\
{
  a: "b"
}`
  )
})

test("object on one line", (t) => {
  const actual = stringify(
    { a: "b" },
    { newline: " ", indentSpace: "", lastComma: "" }
  )
  t.is(actual, '{ a: "b" }')
})

test("automatic quotes for object keys", (t) => {
  const obj = { "a": 0, "two word": 1, 'a"b"c': 2, "42": 42 }
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  42: 42,
  a: 0,
  "two word": 1,
  "a\\"b\\"c": 2,
}`
  )
})

test("object nested", (t) => {
  const obj = { a: { b: { c: [1, 2], d: {} } } }
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  a: {
    b: {
      c: [
        1,
        2,
      ],
      d: {},
    },
  },
}`
  )
})

test.skip("getters", (t) => {
  const obj = {
    a: 1,
    get b() {
      return 2
    },
  }
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  a: 1,
  get b() {
    return 2
  },
}`
  )
})

test("getters", "traceGetters: false", (t) => {
  const obj = {
    a: 1,
    get b() {
      return 2
    },
  }
  const actual = stringify(obj, { traceDescriptor: false })
  t.is(
    actual,
    `\
{
  a: 1,
  b: 2,
}`
  )
})

test("getters", "Host object", (t) => {
  class Foo {
    a = 1
    get b() {
      return 2
    }
  }
  const obj = new Foo()
  const actual = stringify(obj, { traceDescriptor: false })
  t.is(
    actual,
    `\
/* Foo */ {
  a: 1,
  b: 2,
}`
  )
})

test("object nested on one line", (t) => {
  const obj = { a: { b: { c: [1, 2], d: {} } } }
  const actual = stringify(obj, {
    newline: " ",
    indentSpace: "",
    lastComma: "",
  })
  t.is(actual, "{ a: { b: { c: [ 1, 2 ], d: {} } } }")
})

test("custom object", (t) => {
  function Foo() {
    this.a = 1
  }

  const actual = stringify(new Foo())
  t.is(
    actual,
    `\
/* Foo */ {
  a: 1,
}`
  )
})

test("custom object prefix & postfix", (t) => {
  function Foo() {
    this.a = 1
  }

  const actual = stringify(new Foo(), { prefix: "_Foo_(", postfix: ")" })
  t.is(
    actual,
    `\
_Foo_({
  a: 1,
})`
  )
})

test("empty custom object", (t) => {
  function Foo() {}
  const actual = stringify(new Foo())
  t.is(actual, "/* Foo */ {}")
})

test("ignoreKeys", (t) => {
  const obj = {
    a: 1,
    b: 2,
    c: 3,
    d: {
      a: 1,
      b: 2,
      c: 3,
    },
  }
  const actual = stringify(obj, { ignoreKeys: ["a", "c"] })
  t.is(
    actual,
    `\
{
  b: 2,
  d: {
    b: 2,
  },
}`
  )
})

/* es20xx
========= */

test("class", (t) => {
  class Foo {
    derp() {
      console.log(this)
    }
  }
  const actual = stringify(Foo)
  t.is(
    actual,
    `\
class Foo {
  derp() {
    console.log(this)
  }
}`
  )
})

test("Set", (t) => {
  const actual = stringify(new Set([1, 2, 3]))
  t.is(
    actual,
    `\
new Set([
  1,
  2,
  3,
])`
  )
})

test("Set", 2, (t) => {
  const actual = stringify(new Set([1, [2, { a: 3 }]]))
  t.is(
    actual,
    `\
new Set([
  1,
  [
    2,
    {
      a: 3,
    },
  ],
])`
  )
})

test("Set", 3, (t) => {
  const actual = stringify({ x: new Set([1, [2, { a: 3 }]]) })
  t.is(
    actual,
    `\
{
  x: new Set([
    1,
    [
      2,
      {
        a: 3,
      },
    ],
  ]),
}`
  )
})

test("Map", (t) => {
  t.is(
    stringify(
      new Map([
        [1, 2],
        [2, 4],
      ])
    ),
    `\
new Map([
  [ 1, 2 ],
  [ 2, 4 ],
])`
  )
})

test("Map", 2, (t) => {
  t.is(
    stringify(
      new Map([
        [1, 2],
        [2, [4, { a: 5 }]],
      ])
    ),
    `\
new Map([
  [ 1, 2 ],
  [ 2, [ 4, { a: 5 } ] ],
])`
  )
})

test("Map", "cyclic", (t) => {
  const a = { a: 1 }
  const obj = new Map([
    [1, a],
    [2, a],
  ])

  a.b = a

  obj.set("cyclic", obj)

  t.is(
    stringify({ x: obj }),
    `\
{
  x: new Map([
    [ 1, { a: 1, b: /* [↖] */ { $ref: "#/x/1" } } ],
    [ 2, { a: 1, b: /* [↖] */ { $ref: "#/x/1" } } ],
    [ "cyclic", /* [↖] */ { $ref: "#/x" } ],
  ]),
}`
  )
})

test("Set", "cyclic", (t) => {
  const a = { a: 1 }
  const obj = new Set([a, { y: a }])

  a.b = a

  obj.add(obj)

  t.is(
    stringify({ x: obj }),
    `\
{
  x: new Set([
    {
      a: 1,
      b: /* [↖] */ { $ref: "#/x/0" },
    },
    {
      y: /* [↖] */ { $ref: "#/x/0" },
    },
    /* [↖] */ { $ref: "#/x" },
  ]),
}`
  )
})

test("empty Set", (t) => {
  t.is(stringify(new Set()), "new Set()")
})

test("empty Map", (t) => {
  t.is(stringify(new Map()), "new Map()")
})

test("WeakSet", (t) => {
  t.is(stringify(new WeakSet()), "new WeakSet()")
})

test("WeakMap", (t) => {
  t.is(stringify(new WeakMap()), "new WeakMap()")
})

test("Symbol", (t) => {
  let a = stringify(Symbol(1))
  t.is(a, 'Symbol("1")')
  a = stringify(Symbol("derp"))
  t.is(a, 'Symbol("derp")')
  a = stringify(Symbol('super " derp'))
  t.is(a, 'Symbol("super \\" derp")')
  a = stringify(Symbol('super " derp'))
  t.is(a, 'Symbol("super \\" derp")')
})

test("Symbol.for", (t) => {
  const a = stringify(Symbol.for("baz"))
  t.is(a, 'Symbol.for("baz")')
})

test("Well-known symbols", (t) => {
  const a = stringify(Symbol.iterator)
  t.is(a, "Symbol.iterator")
})

test("Symbols as keys", (t) => {
  const a = stringify({
    foo: 1,
    [Symbol("baz")]: 3,
    bar: 2,
    [Symbol.for("derp")]: 4,
    [Symbol.toStringTag]: "Foo",
  })
  t.is(
    a,
    `\
/* Foo */ {
  foo: 1,
  bar: 2,
  [Symbol("baz")]: 3,
  [Symbol.for("derp")]: 4,
  [Symbol.toStringTag]: "Foo",
}`
  )
})

/* typed arrays
=============== */

test("ArrayBuffer hexdump", (t) => {
  let buffer = stringToArrayBuffer("console.log(hello 👾 world);")
  const string = stringify(buffer)
  t.is(
    string,
    `\
/* ArrayBuffer */ new Uint8Array([
  0x63,0x6f,0x6e,0x73,0x6f,0x6c,0x65,0x2e, 0x6c,0x6f,0x67,0x28,0x68,0x65,0x6c,0x6c, // console.log(hell
  0x6f,0x20,0xf0,0x9f,0x91,0xbe,0x20,0x77, 0x6f,0x72,0x6c,0x64,0x29,0x3b,           // o .... world);
]).buffer`
  )

  // ArrayBuffer hexdump is also valid javascript
  t.eq(eval(string), buffer)

  t.is(
    stringify(stringToArrayBuffer("console.log(hello world)")),
    `\
/* ArrayBuffer */ new Uint8Array([
  0x63,0x6f,0x6e,0x73,0x6f,0x6c,0x65,0x2e, 0x6c,0x6f,0x67,0x28,0x68,0x65,0x6c,0x6c, // console.log(hell
  0x6f,0x20,0x77,0x6f,0x72,0x6c,0x64,0x29,                                          // o world)
]).buffer`
  )

  buffer = new Uint8Array(new Array(256).fill(0).map((_, i) => i)).buffer
  // t.log(buffer)

  const a = stringify(buffer)
  const b = `\
/* ArrayBuffer */ new Uint8Array([
  0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07, 0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f, // ................
  0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17, 0x18,0x19,0x1a,0x1b,0x1c,0x1d,0x1e,0x1f, // ................
  0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27, 0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f, //  !"#$%&'()*+,-./
  0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37, 0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f, // 0123456789:;<=>?
  0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47, 0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f, // @ABCDEFGHIJKLMNO
  0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57, 0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f, // PQRSTUVWXYZ[\\]^_
  0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67, 0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f, // \`abcdefghijklmno
  0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77, 0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0x7f, // pqrstuvwxyz{|}~.
  0x80,0x81,0x82,0x83,0x84,0x85,0x86,0x87, 0x88,0x89,0x8a,0x8b,0x8c,0x8d,0x8e,0x8f, // ................
  0x90,0x91,0x92,0x93,0x94,0x95,0x96,0x97, 0x98,0x99,0x9a,0x9b,0x9c,0x9d,0x9e,0x9f, // ................
  0xa0,0xa1,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7, 0xa8,0xa9,0xaa,0xab,0xac,0xad,0xae,0xaf, // ................
  0xb0,0xb1,0xb2,0xb3,0xb4,0xb5,0xb6,0xb7, 0xb8,0xb9,0xba,0xbb,0xbc,0xbd,0xbe,0xbf, // ................
  0xc0,0xc1,0xc2,0xc3,0xc4,0xc5,0xc6,0xc7, 0xc8,0xc9,0xca,0xcb,0xcc,0xcd,0xce,0xcf, // ................
  0xd0,0xd1,0xd2,0xd3,0xd4,0xd5,0xd6,0xd7, 0xd8,0xd9,0xda,0xdb,0xdc,0xdd,0xde,0xdf, // ................
  0xe0,0xe1,0xe2,0xe3,0xe4,0xe5,0xe6,0xe7, 0xe8,0xe9,0xea,0xeb,0xec,0xed,0xee,0xef, // ................
  0xf0,0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7, 0xf8,0xf9,0xfa,0xfb,0xfc,0xfd,0xfe,0xff, // ................
]).buffer`

  t.is(a, b)
})

test("ArrayBuffer hexdump", "{maxBytes:256}", (t) => {
  const { buffer } = new Uint8Array(new Array(300).fill(0).map((_, i) => i))

  const b = `\
/* ArrayBuffer */ new Uint8Array([
  0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07, 0x08,0x09,0x0a,0x0b,0x0c,0x0d,0x0e,0x0f, // ................
  0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17, 0x18,0x19,0x1a,0x1b,0x1c,0x1d,0x1e,0x1f, // ................
  0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27, 0x28,0x29,0x2a,0x2b,0x2c,0x2d,0x2e,0x2f, //  !"#$%&'()*+,-./
  0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37, 0x38,0x39,0x3a,0x3b,0x3c,0x3d,0x3e,0x3f, // 0123456789:;<=>?
  0x40,0x41,0x42,0x43,0x44,0x45,0x46,0x47, 0x48,0x49,0x4a,0x4b,0x4c,0x4d,0x4e,0x4f, // @ABCDEFGHIJKLMNO
  0x50,0x51,0x52,0x53,0x54,0x55,0x56,0x57, 0x58,0x59,0x5a,0x5b,0x5c,0x5d,0x5e,0x5f, // PQRSTUVWXYZ[\\]^_
  0x60,0x61,0x62,0x63,0x64,0x65,0x66,0x67, 0x68,0x69,0x6a,0x6b,0x6c,0x6d,0x6e,0x6f, // \`abcdefghijklmno
  0x70,0x71,0x72,0x73,0x74,0x75,0x76,0x77, 0x78,0x79,0x7a,0x7b,0x7c,0x7d,0x7e,0x7f, // pqrstuvwxyz{|}~.
  0x80,0x81,0x82,0x83,0x84,0x85,0x86,0x87, 0x88,0x89,0x8a,0x8b,0x8c,0x8d,0x8e,0x8f, // ................
  0x90,0x91,0x92,0x93,0x94,0x95,0x96,0x97, 0x98,0x99,0x9a,0x9b,0x9c,0x9d,0x9e,0x9f, // ................
  0xa0,0xa1,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7, 0xa8,0xa9,0xaa,0xab,0xac,0xad,0xae,0xaf, // ................
  0xb0,0xb1,0xb2,0xb3,0xb4,0xb5,0xb6,0xb7, 0xb8,0xb9,0xba,0xbb,0xbc,0xbd,0xbe,0xbf, // ................
  0xc0,0xc1,0xc2,0xc3,0xc4,0xc5,0xc6,0xc7, 0xc8,0xc9,0xca,0xcb,0xcc,0xcd,0xce,0xcf, // ................
  0xd0,0xd1,0xd2,0xd3,0xd4,0xd5,0xd6,0xd7, 0xd8,0xd9,0xda,0xdb,0xdc,0xdd,0xde,0xdf, // ................
  0xe0,0xe1,0xe2,0xe3,0xe4,0xe5,0xe6,0xe7, 0xe8,0xe9,0xea,0xeb,0xec,0xed,0xee,0xef, // ................
  0xf0,0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7, 0xf8,0xf9,0xfa,0xfb,0xfc,0xfd,0xfe,0xff, // ................
  /* […] 44 unshown bytes */
]).buffer`

  t.is(stringify(buffer, { maxBytes: 256 }), b)
  t.is(stringify.inspect(buffer), b)
})

test("ArrayBuffer hexdump", "min", (t) => {
  const buffer = stringToArrayBuffer("console.log(hello 👾 world);")
  const string = stringify.min(buffer)
  t.is(
    string,
    `new Uint8Array([0x63,0x6f,0x6e,0x73,0x6f,0x6c,0x65,0x2e,0x6c,0x6f,0x67,0x28,0x68,0x65,0x6c,0x6c,0x6f,0x20,0xf0,0x9f,0x91,0xbe,0x20,0x77,0x6f,0x72,0x6c,0x64,0x29,0x3b]).buffer`
  )

  t.is(arrayBufferToString(eval(string)), "console.log(hello 👾 world);")
})

test("ArrayBuffer hexdump", "min", 2, (t) => {
  const buffer = stringToArrayBuffer("\0\0\0")
  const string = stringify.min(buffer)
  t.is(string, `new Uint8Array(3).buffer`)
  t.is(arrayBufferToString(eval(string)), "\0\0\0")
})

test("Uint8Array hexdump", (t) => {
  const string = stringify(new Uint8Array(3))
  t.is(string, `new Uint8Array(3)`)
})

test("Uint8Array hexdump", 2, (t) => {
  const string = stringify(new Uint8Array(stringToArrayBuffer("foo")))
  t.is(
    string,
    `\
new Uint8Array([
  0x66,0x6f,0x6f,                                                                   // foo
])`
  )
})

test("Uint8Array hexdump", 3, (t) => {
  const string = stringify(new Uint8Array(stringToArrayBuffer("foo")), {
    addComments: false,
  })
  t.is(
    string,
    `\
new Uint8Array([
  0x66,0x6f,0x6f,
])`
  )
})

/* async
======== */

test("stringify with async option return a promise", async (t) => {
  const x = { a: 1 }
  const a = await stringify(x, { async: true })
  t.is(
    a,
    `\
{
  a: 1,
}`
  )
})

/* Blob
======= */

if ("Blob" in globalThis) {
  test.serial("blob - sync stringify return blobs as objects", (t) => {
    t.timeout(2000)
    const x = new Blob(["ab"], { type: "text/plain" })
    const a = stringify(x)
    t.true(a.startsWith("/* Blob */ {\n"))
    t.true(a.includes("size: 2,"))
    t.true(a.includes('type: "text/plain",'))
  })

  test.serial("blob", async (t) => {
    t.timeout(2000)
    const x = new Blob(["ab"], { type: "text/plain" })
    // TODO: test Blob with extended properties
    let a
    a = await stringify(x, { async: true })
    t.is(a, `new Blob(["ab"], { type: "text/plain" })`)
    a = await stringify.min(x, { async: true })
    t.is(a, `new Blob(["ab"],{type:"text/plain"})`)
  })

  test.serial("blob - arrayBuffer", async (t) => {
    t.timeout(2000)
    const x = new Blob(["ab"])
    const a = await stringify(x, { async: true })
    t.is(
      a,
      `\
new Blob([new Uint8Array([
  0x61,0x62,                                                                        // ab
])])`
    )
    t.is(await new Response(eval(a)).text(), "ab")
  })

  test.serial("blob in object", async (t) => {
    t.timeout(2000)
    const x = new Blob(["ab"])
    const a = await stringify({ x }, { async: true })
    t.is(
      a,
      `\
{
  x: new Blob([new Uint8Array([
    0x61,0x62,                                                                        // ab
  ])]),
}`
    )
  })

  /* File
  ======= */

  const lastModified = new Date("2019-04-18T02:45:55.555Z")

  test.serial("File - sync stringify return files as objects", (t) => {
    t.timeout(2000)
    const x = new File(["ab"], "a.txt", { type: "text/plain", lastModified })
    const a = stringify(x)
    t.true(a.startsWith("/* File */ {\n"))
    t.true(a.includes("size: 2,"))
    t.true(a.includes('type: "text/plain",'))
    t.true(a.includes("lastModified: 1555555555555,"))
    t.true(a.includes('name: "a.txt",'))
  })

  test.serial("File", async (t) => {
    t.timeout(2000)
    const x = new File(["ab"], "a.txt", { type: "text/plain", lastModified })
    let a
    a = await stringify(x, { async: true })
    t.is(
      a,
      `new File(["ab"], "a.txt", { type: "text/plain", lastModified: 1555555555555 })`
    )
    a = await stringify.min(x, { async: true })
    t.is(
      a,
      `new File(["ab"],"a.txt",{type:"text/plain",lastModified:1555555555555})`
    )
  })

  test.serial("File - arrayBuffer", async (t) => {
    t.timeout(2000)
    const x = new File(["ab"], "a.exe", { lastModified })
    const a = await stringify(x, { async: true })
    t.is(
      a,
      `\
new File([new Uint8Array([
  0x61,0x62,                                                                        // ab
])], "a.exe", { lastModified: 1555555555555 })`
    )
    t.is(await new Response(eval(a)).text(), "ab")
  })

  test.serial("File in object", async (t) => {
    t.timeout(2000)
    const x = new File(["ab"], "a.exe", { lastModified })
    const a = await stringify({ x }, { async: true })
    t.is(
      a,
      `\
{
  x: new File([new Uint8Array([
    0x61,0x62,                                                                        // ab
  ])], "a.exe", { lastModified: 1555555555555 }),
}`
    )
  })
}

/* limits
========= */

test("maxBytes", (t) => {
  const a = stringify(
    new Uint8Array(new Array(11).fill(0).map((_, i) => i)).buffer,
    { maxBytes: 10 }
  )
  t.is(
    a,
    `\
/* ArrayBuffer */ new Uint8Array([
  0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07, 0x08,0x09,                               // ...........
  /* […] 1 unshown byte */
]).buffer`
  )
})

test("maxChars", (t) => {
  const a = stringify("abcdefghijklmnopqrstuvwxyz", { maxChars: 10 })
  t.is(a, `"abcdefghij" /* […] 16 unshown chars */`)
})

test("maxLines", (t) => {
  const x = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl"
  const a = stringify(x, { maxLines: 3 })
  t.is(
    a,
    `\`\\
a
b
c\` /* […] 9 unshown lines */`
  )
})

test("maxItems", "object", (t) => {
  const x = { a: 1, b: 2, c: 3 }
  const a = stringify(x, { maxItems: 2 })
  t.is(
    a,
    `\
{
  a: 1,
  b: 2,
  /* […] 1 unshown item */
}`
  )
})

test("maxItems", "array", (t) => {
  const x = ["a", "b", "c"]
  const a = stringify(x, { maxItems: 2 })
  t.is(
    a,
    `\
[
  "a",
  "b",
  /* […] 1 unshown item */
]`
  )
})

test("maxItems", "set", (t) => {
  const x = new Set(["a", "b", "c"])
  const a = stringify(x, { maxItems: 2 })
  t.is(
    a,
    `\
new Set([
  "a",
  "b",
  /* […] 1 unshown item */
])`
  )
})

test("maxItems", "map", (t) => {
  const x = new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ])
  const a = stringify(x, { maxItems: 2 })
  t.is(
    a,
    `\
new Map([
  [ "a", 1 ],
  [ "b", 2 ],
  /* […] 1 unshown item */
])`
  )
})

/* circular
=========== */

// test("circular object", "root", (t) => {
//   const obj = { x: { $ref: "#/y" }, y: [1] }
//   obj.circular = obj
//   const actual = stringify(obj)

//   const resolved = resolve(eval(`(${actual})`))
//   t.is(resolved, resolved.circular)
//   t.is(resolved.x, resolved.y)

//   t.is(
//     actual,
//     `\
// {
//   x: {
//     $ref: "#/y",
//   },
//   y: [
//     1,
//   ],
//   circular: /* [↖] */ { $ref: "#" },
// }`
//   )
// })

// test("circular object", "nested", (t) => {
//   const obj = { x: {} }
//   obj.circular = obj.x
//   const actual = stringify(obj)

//   const resolved = resolve(eval(`(${actual})`))
//   t.is(resolved.x, resolved.circular)

//   t.is(
//     actual,
//     `\
// {
//   x: {},
//   circular: /* [↖] */ { $ref: "#/x" },
// }`
//   )
// })

// test("circular array", (t) => {
//   const arr = []
//   arr[0] = arr
//   arr[1] = 123
//   const actual = stringify(arr)

//   const resolved = resolve(eval(`(${actual})`))
//   t.is(resolved[0], resolved)

//   t.is(
//     actual,
//     `\
// [
//   /* [↖] */ { $ref: "#" },
//   123,
// ]`
//   )
// })

// test("circular array", "nested", (t) => {
//   const arr = []
//   arr[0] = [arr]
//   arr[1] = [arr[0]]
//   const actual = stringify(arr)

//   const resolved = resolve(eval(`(${actual})`))
//   t.is(resolved[0][0], resolved)
//   t.is(resolved[1][0], resolved[0])

//   t.is(
//     actual,
//     `\
// [
//   [
//     /* [↖] */ { $ref: "#" },
//   ],
//   [
//     /* [↖] */ { $ref: "#/0" },
//   ],
// ]`
//   )
// })

// test("circular array", "nested", 2, (t) => {
//   const arr = []
//   const x = ["a"]
//   arr[0] = x
//   arr[1] = x
//   arr[2] = x

//   const actual = stringify(arr)

//   const resolved = resolve(eval(`(${actual})`))
//   t.is(resolved[0], resolved[1])
//   t.is(resolved[1], resolved[2])

//   resolved[2][0] = "b"
//   t.is(resolved[0][0], "b")

//   t.is(
//     actual,
//     `\
// [
//   [
//     "a",
//   ],
//   /* [↖] */ { $ref: "#/0" },
//   /* [↖] */ { $ref: "#/0" },
// ]`
//   )
// })

// // test.only("$defs object has priority to make references", (t) => {
// //   const schema = {
// //     properties: {
// //       allOf: { $ref: "#/$defs/schemaArray" },
// //       anyOf: { $ref: "#/$defs/schemaArray" },
// //     },
// //     $defs: {
// //       schemaArray: {
// //         type: "array",
// //       },
// //     },
// //   }

// //   const obj = resolve(schema)
// //   t.is(obj)
// //   t.is(obj.properties.allOf, obj.properties.anyOf)
// //   const actual = stringify(obj)
// //   t.is(
// //     actual,
// //     `\
// // {
// //   properties: {
// //     allOf: /* [↖] */ { $ref: "#/$defs/schemaArray" },
// //     anyOf: /* [↖] */ { $ref: "#/$defs/schemaArray" },
// //   },
// //   $defs: {
// //     schemaArray: {
// //       type: "array",
// //     },
// //   },
// // }`
// //   )
// // })

// // test("$ref in $defs", (t) => {
// //   const obj = resolve({
// //     x: {
// //       $ref: "#/$defs/c",
// //     },
// //     y: {
// //       $ref: "#/$defs/b",
// //     },
// //     $defs: {
// //       a: { type: "integer" },
// //       b: { $ref: "#/$defs/a" },
// //       c: { $ref: "#/$defs/b" },
// //     },
// //   })
// //   const actual = stringify(obj)
// //   t.eq(
// //     actual,
// //     `\
// // {
// //   x: /* [↖] */ { $ref: "#/$defs/c" },
// //   y: /* [↖] */ { $ref: "#/$defs/c" },
// //   $defs: {
// //     a: /* [↖] */ { $ref: "#/$defs/c" },
// //     b: /* [↖] */ { $ref: "#/$defs/c" },
// //     c: {
// //       type: "integer",
// //     },
// //   },
// // }`
// //   )
// // })

// test("make references relative to $id", (t) => {
//   const schema = {
//     allOf: [
//       {
//         $id: "http://localhost/a",
//         properties: {
//           foo: { $ref: "#/$defs/string" },
//         },
//         $defs: {
//           string: {
//             type: "string",
//           },
//         },
//       },
//     ],
//   }

//   const obj = resolve(schema)
//   const actual = stringify(obj)
//   t.is(
//     actual,
//     `\
// {
//   allOf: [
//     {
//       $id: "http://localhost/a",
//       properties: {
//         foo: /* [↖] */ { $ref: "#/$defs/string" },
//       },
//       $defs: {
//         string: {
//           type: "string",
//         },
//       },
//     },
//   ],
// }`
//   )
// })

test("circular Set", (t) => {
  const set = new Set()
  set.add(set)
  set.add(123)
  const actual = stringify(set)
  t.is(
    actual,
    `\
new Set([
  /* [↖] */ { $ref: "#" },
  123,
])`
  )
})

test("circular Set", "nested", (t) => {
  const obj = { set: new Set() }
  obj.set.add(obj)
  obj.set.add(obj.set)
  const actual = stringify(obj)
  t.is(
    actual,
    `\
{
  set: new Set([
    /* [↖] */ { $ref: "#" },
    /* [↖] */ { $ref: "#/set" },
  ]),
}`
  )
})

test("circular Map", (t) => {
  const map = new Map()
  map.set("circular", map)
  map.set("n", 123)

  const actual = stringify(map)
  // const resolved = resolve(eval(`(${actual})`))
  // t.is(resolved.get("circular"), resolved)

  t.is(
    actual,
    `\
new Map([
  [ "circular", /* [↖] */ { $ref: "#" } ],
  [ "n", 123 ],
])`
  )
})

/* presets
========== */

test("example from pretty-format", (t) => {
  // https://www.npmjs.com/package/pretty-format
  const val = { object: {} }
  val.circular = val
  val[Symbol("foo")] = "foo"
  val.map = new Map([["prop", "value"]])
  val.array = [-0, Infinity, Number.NaN]
  const actual = stringify(val)
  t.is(
    actual,
    `\
{
  object: {},
  circular: /* [↖] */ { $ref: "#" },
  map: new Map([
    [ "prop", "value" ],
  ]),
  array: [
    -0,
    Infinity,
    NaN,
  ],
  [Symbol("foo")]: "foo",
}`
  )
})

test("min", (t) => {
  const val = { object: {} }
  val.circular = val
  val[Symbol("foo")] = "foo\nbar"
  val.map = new Map([["prop", "value"]])
  val.array = [-0, Infinity, Number.NaN]
  const actual = stringify.min(val)
  t.is(
    actual,
    `{object:{},circular:{$ref:"#"},map:new Map([["prop","value"]]),array:[-0,Infinity,NaN],[Symbol("foo")]:"foo\\nbar"}`
  )
})

test("line", "simple object", (t) => {
  const str = stringify.line({ a: 1, b: "2", c: "str" })
  t.is(str, '{ a: 1, b: "2", c: "str" }')
})

test("line", "quotes", (t) => {
  const str = stringify.line({ "a": 1, 'two " words': 2, 'escape " quote': 2 })
  t.is(str, '{ a: 1, "two \\" words": 2, "escape \\" quote": 2 }')
})

test("line", "array", (t) => {
  const str = stringify.line([1, 2])
  t.is(str, "[ 1, 2 ]")
})

test("line", "array with undefined", (t) => {
  const str = stringify.line([1, 2, undefined, null, , 'string"s test'])
  t.is(str, '[ 1, 2, undefined, null, , "string\\"s test" ]')
})

test("line", "regex", (t) => {
  const str = stringify.line(/foo/i)
  t.is(str, "/foo/i")
})

test("line", "primitives", (t) => {
  let str = stringify.line(null)
  t.is(str, "null")
  str = stringify.line(undefined)
  t.is(str, "undefined")
  str = stringify.line()
  t.is(str, "undefined")
})

test("line", "complex", (t) => {
  const str = stringify.line([1, { "key": 1, 'two "word"': 'string"s test' }])
  t.is(str, '[ 1, { key: 1, "two \\"word\\"": "string\\"s test" } ]')
})

test("line", "complex", 2, (t) => {
  const str = stringify.line([
    /foo/i,
    { "key": [1, 2, 3], "two `word`": 'string"s test' },
  ])
  t.is(str, '[ /foo/i, { key: [ 1, 2, 3 ], "two `word`": "string\\"s test" } ]')
})

test("line", "complex", 3, (t) => {
  const str = stringify.line({
    "key": [1, 2, 3],
    'two "word"': [{ a: 1, key: "ok ok" }],
  })
  t.is(
    str,
    '{ key: [ 1, 2, 3 ], "two \\"word\\"": [ { a: 1, key: "ok ok" } ] }'
  )
})

test("line", "circular", (t) => {
  const obj = { "key": [1, 2, 3], 'two "word"': [{ a: 1, key: "ok ok" }] }
  obj.obj = obj
  const str = stringify.line(obj)
  t.is(
    str,
    `{ key: [ 1, 2, 3 ], "two \\"word\\"": [ { a: 1, key: "ok ok" } ], obj: /* [↖] */ { $ref: "#" } }`
  )
})

test("list", "circular", (t) => {
  const obj = { "key": [1, 2, 3], 'two "word"': [{ a: 1, key: "ok ok" }] }
  obj.obj = obj
  const str = stringify.list(obj)
  t.is(
    str,
    `\
{
  key: [ 1, 2, 3 ],
  "two \\"word\\"": [ { a: 1, key: "ok ok" } ],
  obj: /* [↖] */ { $ref: "#" },
}`
  )
})

test("inspect", "single-line string", (t) => {
  const obj = 'a"b"c'
  const str = stringify.inspect(obj)
  t.is(str, '"a\\"b\\"c"')
})

test("inspect", "multi-lines string", (t) => {
  const obj = "a\nb\nc"
  const str = stringify.inspect(obj)
  t.is(str, "`\\\na\nb\nc`")
})

test("inspect", "trailing whitespaces", (t) => {
  t.is(stringify.inspect("a \nb"), "`\\\na ␊\nb`")
  t.is(stringify.inspect("a\t\nb"), "`\\\na\\t\nb`")
  t.is(stringify.inspect("a\n\nb"), "`\\\na\n\nb`")
})

test("bug: indent", (t) => {
  const data = {
    a: new Map([
      [1, 2],
      [2, 4],
    ]),
    b: new Map([
      ["abcdefghijkl", { x: 123, y: 456 }],
      ["xyz", { x: 789, y: 48_987 }],
    ]),
  }
  t.is(
    stringify.inspect(data),
    `\
{
  a: new Map([
    [
      1,
      2,
    ],
    [
      2,
      4,
    ],
  ]),
  b: new Map([
    [
      "abcdefghijkl",
      {
        x: 123,
        y: 456,
      },
    ],
    [
      "xyz",
      {
        x: 789,
        y: 48987,
      },
    ],
  ]),
}`
  )
})

test("inspect", "escape unicode", (t) => {
  const obj = {
    a: "\x1b u200b-> ​ ",
    b: "🙃",
  }

  const str = stringify.inspect(obj)
  t.is(
    str,
    `\
{
  a: "\\x1b u200b-> \\u200b ",
  b: "\\ud83d\\ude43",
}`
  )
})

test("{displayNewlines:true}", (t) => {
  const str = stringify("a\nb")
  t.is(
    str,
    `\
\`\\
a
b\``
  )
})

test("{displayNewlines:false}", (t) => {
  const str = stringify("a\nb", { displayNewlines: false })
  t.is(str, '"a\\nb"')
})

test.todo("addComments: false")
