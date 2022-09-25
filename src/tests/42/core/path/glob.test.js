import test from "../../../../42/test.js"
import glob from "../../../../42/core/path/glob.js"

test("*", (t) => {
  t.eq(glob("foo", "f"), [])
  t.eq(glob("foo", "x*"), [])
  t.eq(glob("foo", "*x"), [])
  t.eq(glob("foo", "*"), ["foo"])
  t.eq(glob("foo", "f*"), ["foo"])
  t.eq(glob("foo", "*o"), ["foo"])
  t.eq(glob("foo", "*oo"), ["foo"])
  t.eq(glob("foo", "f*o"), ["foo"])
  t.eq(glob("foo", "fo*"), ["foo"])
})

test("*", "escaped", (t) => {
  t.eq(glob(["a/b", "*/b"], "*/b"), ["a/b", "*/b"])
  t.eq(glob(["a/b", "*/b"], "\\*/b"), ["*/b"])
})

test("?", (t) => {
  t.eq(glob("foo", "?"), [])
  t.eq(glob("foo", "f?"), [])
  t.eq(glob("foo", "?o"), [])
  t.eq(glob("foo", "??x"), [])
  t.eq(glob("foo", "x??"), [])
  t.eq(glob("foo", "???"), ["foo"])
  t.eq(glob("foo", "f??"), ["foo"])
  t.eq(glob("foo", "??o"), ["foo"])
  t.eq(glob("foo", "f?o"), ["foo"])
  t.eq(glob("fo", "f?o"), [])
})

test("?", "escaped", (t) => {
  t.eq(glob(["a/b", "?/b"], "?/b"), ["a/b", "?/b"])
  t.eq(glob(["a/b", "?/b"], "\\?/b"), ["?/b"])
})

test("{}", (t) => {
  t.eq(glob(["foo", "bar"], "ba{x,y}"), [])
  t.eq(glob(["foo", "bar"], "ba{r,x}"), ["bar"])
  t.eq(glob(["foo", "bar", "baz"], "ba{r,z}"), ["bar", "baz"])
})

test("**", (t) => {
  const paths = ["a/b/c/d", "__c/d", "d"]
  t.eq(glob(paths, "d"), ["d"])
  t.eq(glob(paths, "a/**/d"), ["a/b/c/d"])
  t.eq(glob(paths, "a/**/c/d"), ["a/b/c/d"])
  t.eq(glob(paths, "**/c/d"), ["a/b/c/d"])
  t.eq(glob(paths, "**c/d"), ["__c/d"])
  t.eq(glob(paths, "**/d"), ["a/b/c/d", "__c/d", "d"])
  t.eq(glob(paths, "/**/d"), [])
  t.eq(glob(paths, "*/**/d"), ["a/b/c/d", "__c/d"])
})

test("**/*", (t) => {
  const expected = ["a/b/c.js", "a/b/c/d.js"]
  const paths = ["a.js", "a/b.js", ...expected]
  t.eq(glob(paths, "**/*"), paths)
  t.eq(glob(paths, "a/b/**/*"), expected)
})

test.skip("**", "empty path", (t) => {
  const paths = ["//a", "a//", "a/", "/a", "a"]
  t.eq(glob(paths, "a"), ["a//", "a/", "/a", "a"])
  t.eq(glob(paths, "a/"), ["a//", "a/", "/a"])
  t.eq(glob(paths, "/a"), ["//a", "a/", "/a"])
})

// @src https://github.com/cowboy/node-globule

test("should return empty set if a required argument is missing or an empty set.", (t) => {
  t.eq(glob("", "foo.js"), [])
  t.eq(glob("*.js", ""), [])
  t.eq(glob([], "foo.js"), [])
  t.eq(glob("*.js", []), [])
  t.eq(glob("", ["foo.js"]), [])
  t.eq(glob(["*.js"], ""), [])
})

test("basic matching should match correctly", (t) => {
  t.eq(glob("foo.js", "*.js"), ["foo.js"])
  t.eq(glob(["foo.js"], "*.js"), ["foo.js"])
  t.eq(glob(["foo.js", "bar.css"], "*.js"), ["foo.js"])
  t.eq(glob("foo.js", ["*.js", "*.css"]), ["foo.js"])
  t.eq(glob(["foo.js"], ["*.js", "*.css"]), ["foo.js"])
  t.eq(glob(["foo.js", "bar.css"], ["*.js", "*.css"]), ["foo.js", "bar.css"])
})

test("should fail to match", (t) => {
  t.eq(glob("foo.css", "*.js"), [])
  t.eq(glob(["foo.css", "bar.css"], "*.js"), [])
})

test("should return a uniqued set", (t) => {
  t.eq(glob(["foo.js", "foo.js"], "*.js"), ["foo.js"])
  t.eq(glob(["foo.js", "foo.js"], ["*.js", "*.*"]), ["foo.js"])
})

test("solitary exclusion should match nothing", (t) => {
  t.eq(glob(["foo.js", "bar.js"], ["!*.js"]), [])
})

test("exclusion should cancel match", (t) => {
  t.eq(glob(["foo.js", "bar.js"], ["*.js", "!*.js"]), [])
})

test("partial exclusion should partially cancel match", (t) => {
  t.eq(glob(["foo.js", "bar.js", "baz.js"], ["*.js", "!f*.js"]), [
    "bar.js",
    "baz.js",
  ])
})

test("inclusion / exclusion order matters", (t) => {
  t.eq(glob(["foo.js", "bar.js", "baz.js"], ["*.js", "!*.js", "b*.js"]), [
    "bar.js",
    "baz.js",
  ])
  t.eq(glob(["foo.js", "bar.js", "baz.js"], ["*.js", "!f*.js", "*.js"]), [
    "bar.js",
    "baz.js",
    "foo.js",
  ])
})

// @src https://github.com/sindresorhus/multimatch/blob/master/test/test.js

const fixtures = ["vendor/js/foo.js", "vendor/js/bar.js", "vendor/js/baz.js"]

test("match on multiple patterns", (t) => {
  t.eq(glob(["unicorn", "cake", "rainbows"], ["*", "!cake"]), [
    "unicorn",
    "rainbows",
  ])
  t.eq(glob(["foo", "bar", "baz"], ["foo"]), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["!foo"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "bar"]), ["foo", "bar"])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "!bar"]), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["!foo", "bar"]), ["bar"])
  t.eq(glob(["foo", "bar", "baz"], ["!foo", "!bar"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["!*{o,r}", "foo"]), ["foo"])
})

test("return an array of matches", (t) => {
  t.eq(glob(["foo", "bar", "baz"], "foo"), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["f*"]), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["f*", "bar"]), ["foo", "bar"])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "bar"]), ["foo", "bar"])
})

test("return matches in the order the patterns were defined", (t) => {
  t.eq(glob(["foo", "bar", "baz"], ["bar", "f*"]), ["bar", "foo"])
  t.eq(glob(["foo", "bar", "baz"], ["f*", "*z"]), ["foo", "baz"])
  t.eq(glob(["foo", "bar", "baz"], ["*z", "f*"]), ["baz", "foo"])
})

test("return an array with negations omitted", (t) => {
  t.eq(glob(["foo", "bar", "baz"], "!foo"), [])
  t.eq(glob(["foo", "bar", "baz"], ["!foo"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["!foo", "!bar"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["!*z"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["!*z", "!*a*"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["!*"]), [])
  t.eq(glob(fixtures, ["!**/*z.js"]), [])
  t.eq(glob(fixtures, ["!**/*z.js", "**/foo.js"]), ["vendor/js/foo.js"])
  t.eq(glob(fixtures, ["!**/*z.js", "!**/*a*.js"]), [])
})

test("return an empty array when no matches are found", (t) => {
  t.eq(glob(["foo", "bar", "baz"], ["quux"]), [])
  t.eq(glob(fixtures, ["!**/*.js"]), [])
})

test("patterns be order sensitive", (t) => {
  t.eq(glob(["foo", "bar", "baz"], ["!*a*", "*z"]), ["baz"])
  t.eq(glob(["foo", "bar", "baz"], ["*z", "!*a*"]), [])
  t.eq(glob(["foo", "foam", "for", "forum"], ["!*m", "f*"]), [
    "foo",
    "foam",
    "for",
    "forum",
  ])
  t.eq(glob(["foo", "foam", "for", "forum"], ["f*", "!*m"]), ["foo", "for"])
  t.eq(glob(["foo", "bar", "baz"], ["!*{o,r}", "foo"]), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "!*{o,r}"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["!foo", "bar"]), ["bar"])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "!bar"]), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["bar", "!foo", "foo"]), ["bar", "foo"])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "!foo", "bar"]), ["bar"])
})

test("override negations and re-include explicitly defined patterns", (t) => {
  t.eq(glob(["foo", "bar", "baz"], ["!*"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["!*a*"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["bar", "!*a*"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["!*a*", "bar"]), ["bar"])
  t.eq(glob(["foo", "bar", "baz"], ["!*a*", "*"]), ["foo", "bar", "baz"])
  t.eq(glob(["foo", "bar", "baz"], ["!*a*", "*z"]), ["baz"])
})

test("misc", (t) => {
  t.eq(glob(["foo", "bar", "baz"], ["*", "!foo"]), ["bar", "baz"])
  t.eq(glob(["foo", "bar", "baz"], ["*", "!foo", "bar"]), ["bar", "baz"])
  t.eq(glob(["foo", "bar", "baz"], ["*", "!foo"]), ["bar", "baz"])
  t.eq(glob(["foo", "bar", "baz"], ["!foo", "*"]), ["foo", "bar", "baz"])
  t.eq(glob(["foo", "bar", "baz"], ["*", "!foo", "!bar"]), ["baz"])
  t.eq(glob(["foo", "bar", "baz"], ["!*{o,r}", "*"]), ["foo", "bar", "baz"])
  t.eq(glob(["foo", "bar", "baz"], ["*", "!*{o,r}"]), ["baz"])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "!*{o,r}", "*"]), [
    "foo",
    "bar",
    "baz",
  ])
  t.eq(glob(["foo", "bar", "baz"], ["*", "!*{o,r}", "foo"]), ["baz", "foo"])
  t.eq(glob(["foo", "bar", "baz"], ["!*{o,r}", "*", "foo"]), [
    "foo",
    "bar",
    "baz",
  ])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "!*{o,r}"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "!*{o,r}", "foo"]), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["!*{o,r}", "foo"]), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["*", "!*{o,r}"]), ["baz"])
  t.eq(glob(["foo", "bar", "baz"], "foo"), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["!foo"]), [])
  t.eq(glob(["foo", "bar", "baz"], ["*", "!foo"]), ["bar", "baz"])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "bar"]), ["foo", "bar"])
  t.eq(glob(["foo", "bar", "baz"], ["foo", "!bar"]), ["foo"])
  t.eq(glob(["foo", "bar", "baz"], ["!foo", "bar"]), ["bar"])
  t.eq(glob(["foo", "bar", "baz"], ["!foo", "!bar"]), [])
  t.eq(
    glob(
      ["foo", "one", "two", "four", "do", "once", "only"],
      ["once", "!o*", "once"]
    ),
    ["once"]
  )
  t.eq(
    glob(
      ["foo", "one", "two", "four", "do", "once", "only"],
      ["*", "!o*", "once"]
    ),
    ["foo", "two", "four", "do", "once"]
  )
})

test("expand dir", (t) => {
  t.eq(glob(["src/a.js", "bin/a.js", "tmp/a.js"], "{src,bin}/**/*.js"), [
    "src/a.js",
    "bin/a.js",
  ])
})

test("expact path", (t) => {
  t.eq(glob(["src/a.js", "bin/a.js", "tmp/a.js"], "src/a.js"), ["src/a.js"])
})

test("glob.locate", (t) => {
  const obj = {
    src: {
      "a.js": 0,
    },
    bin: {
      "a.js": 0,
      "b.js": 0,
    },
  }

  t.eq(glob.locate(obj, "**/*.js"), ["/src/a.js", "/bin/a.js", "/bin/b.js"])
  t.eq(glob.locate(obj, "**/a.js"), ["/src/a.js", "/bin/a.js"])
  t.eq(glob.locate(obj, "/src/a.js"), ["/src/a.js"])
  t.eq(glob.locate(obj, "src/a.js"), ["/src/a.js"])
  t.eq(glob.locate(obj, ""), [])
})
