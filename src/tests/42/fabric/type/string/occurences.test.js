// @src https://jsfiddle.net/Victornpb/5axuh96u/
// @src https://gist.github.com/victornpb/7736865

import test from "../../../../../42/test.js"
import occurrences from "../../../../../42/fabric/type/string/occurences.js"

test("empty substring", (t) => {
  t.is(occurrences("", ""), 1)
  t.is(occurrences("abc", ""), 4)
})

test("single occurences", (t) => {
  t.is(occurrences("foo", "foo"), 1)
  t.is(occurrences("blahfooblah", "foo"), 1)
  t.is(occurrences("foo", "f"), 1)
})

test("multiple occurrences", (t) => {
  t.is(occurrences("foofoofoofoo", "foo"), 4)
  t.is(occurrences("foofoofoofoo", "foofoo"), 2)
  t.is(occurrences("blafooblahfooblah", "foo"), 2)
  t.is(occurrences("foofoofooooofo", "foo"), 3)
})

test("no occurrences", (t) => {
  t.is(occurrences("", "foo"), 0)
  t.is(occurrences("abc", "foo"), 0)
  t.is(occurrences("boo", "foo"), 0)
})

test("overlap", (t) => {
  t.is(occurrences("", "", { overlap: true }), 1)
  t.is(occurrences("abc", "", { overlap: true }), 4)
  t.is(occurrences("foofoofoofoo", "foofoo", { overlap: true }), 3)
  t.is(occurrences("blafooblahfooblah", "foo", { overlap: true }), 2)
  t.is(occurrences("foofoofooooofo", "foo", { overlap: true }), 3)
})

test("overlap no occurrences", (t) => {
  t.is(occurrences("", "foo", { overlap: true }), 0)
  t.is(occurrences("abc", "foo", { overlap: true }), 0)
  t.is(occurrences("boo", "foo", { overlap: true }), 0)
  t.is(occurrences("fooofooofooofoo", "foofoo", { overlap: true }), 0)
  t.is(occurrences("blafobooblahfoboblah", "foo", { overlap: true }), 0)
  t.is(occurrences("fofofofaooooofo", "foo", { overlap: true }), 0)
})
