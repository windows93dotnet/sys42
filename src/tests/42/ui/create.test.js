import test from "../../../42/test.js"
import create from "../../../42/ui/create.js"
import setAttributes from "../../../42/fabric/dom/setAttributes.js"

test("simple", (t) => {
  const actual = create(
    "div",
    { class: "foo" },
    "hello",
    create("strong", "world")
  )
  t.true(actual instanceof HTMLDivElement)
  t.is(actual.outerHTML, '<div class="foo">hello<strong>world</strong></div>')
})

test("arguments order matter only for child nodes", (t) => {
  const actual = create("div", "hello", create("strong", "world"), {
    class: "foo",
  })
  t.is(actual.outerHTML, '<div class="foo">hello<strong>world</strong></div>')
})

test("accept arrays of child nodes", (t) => {
  let actual = create("div", { class: "foo" }, [
    "hello",
    create("strong", "world"),
  ])
  t.is(actual.outerHTML, '<div class="foo">hello<strong>world</strong></div>')

  actual = create(
    "div",
    { class: "foo" },
    ["hello", create("strong", "world")],
    "what's up?"
  )
  t.is(
    actual.outerHTML,
    `<div class="foo">hello<strong>world</strong>what's up?</div>`
  )
})

test("arguments are deeply merged", (t) => {
  const actual = create(
    "div",
    { class: "foo", title: "hello" },
    { class: "bar" }
  )
  t.is(actual.outerHTML, '<div class="bar" title="hello"></div>')
})

test("dynamic id", (t) => {
  const actual = create("div", { id: true })
  t.match(actual.id, /^[a-z][\da-z]{7}$/)
})

test("classes", (t) => {
  let el
  el = create("div", { class: "one" })
  t.is(el.className, "one")
  el = create("div", { class: "one two" })
  t.is(el.className, "one two")
  el = create("div", { class: ["one", "two"] })
  t.is(el.className, "one two")
  el = create("div", { class: { one: true, two: true } })
  t.is(el.className, "one two")
})

test("classes", 2, (t) => {
  let el = create("div")
  el.className = "one two three four"
  el = setAttributes(el, { class: { two: false } })
  t.is(el.className, "one three four")
  el = setAttributes(el, { class: { "one four": false } })
  t.is(el.className, "three")
  el = setAttributes(el, { class: { "x y z": true } })
  t.is(el.className, "three x y z")
})
