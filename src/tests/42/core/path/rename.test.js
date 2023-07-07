import test from "../../../../42/test.js"
import rename from "../../../../42/core/path/rename.js"

const { task } = test

test.tasks(
  [
    task({ task: ["foo.js", "\\*_*_.js", ["*_foo_.js"]] }),
    task({ task: ["a/b/c/file.txt", "*/*.*", ["a/file.txt"]] }),
    task({ task: ["a/b/c/file.txt", "*/*/*.*", ["a/b/file.txt"]] }),
    task({ task: ["a/b/c/file.txt", "**/../*.*", ["a/b/file.txt"]] }),
    task({ task: ["a/b/c/file.txt", "**/../../*.*", ["a/file.txt"]] }),
    task({ task: ["a/b/c/file.txt", "*/foo/**/*.*", ["a/foo/b/c/file.txt"]] }),
    // task({ task: ["a/b/c/file.txt", "**/foo/*/*.*", ["a/b/foo/c/file.txt"]] }),
    task({ task: ["a/b/c/file.txt", "*/foo/**/../*.*", ["a/foo/b/file.txt"]] }),
    task({ task: ["foo.js", "*.js", ["foo.js"]] }),
    task({ task: ["foo.js", "bar.*", ["bar.js"]] }),
    task({ task: ["foo.js", "prefix_*.js", ["prefix_foo.js"]] }),
    task({ task: ["foo.js", "*_suffix.js", ["foo_suffix.js"]] }),
    task({ task: ["a/b/c.js", "*.js", ["c.js"]] }),
    task({ task: ["a/b/c.js", "**/*.*", ["a/b/c.js"]] }),
    task({ task: ["a/b/c.js", "foo/**/*.js", ["foo/a/b/c.js"]] }),
    task({ task: ["a/b/c.js", "foo/**/bar/*.js", ["foo/a/b/bar/c.js"]] }),
  ],

  (test, { task: [path, pattern, expected] }) => {
    test(pattern, (t) => {
      t.eq(rename(path, pattern), expected)
    })
  },
)

test("ignore extension glob if original extension is empty", (t) => {
  t.eq(rename("a/b/c", "*.*"), ["c"])
  t.eq(rename("a/b/c", "**/*.*"), ["a/b/c"])
  t.eq(rename("a/b/c", "*.txt"), ["c.txt"])
  t.eq(rename("a/b/c", "**/*.txt"), ["a/b/c.txt"])
})

const files = [
  "a/b/one.js", //
  "a/b/two.js",
  "a/b/three.js",
]

test("file list", (t) => {
  t.eq(rename(files, "*.js"), [
    "one.js", //
    "two.js",
    "three.js",
  ])

  t.eq(rename(files, "**/*.js"), [
    "a/b/one.js", //
    "a/b/two.js",
    "a/b/three.js",
  ])
})

test("file number", (t) => {
  t.eq(rename(files, "**/#.js"), [
    "a/b/1.js", //
    "a/b/2.js",
    "a/b/3.js",
  ])

  t.eq(rename(files, "**/###.js"), [
    "a/b/001.js", //
    "a/b/002.js",
    "a/b/003.js",
  ])

  t.eq(rename(files, "**/#_*.js"), [
    "a/b/1_one.js",
    "a/b/2_two.js",
    "a/b/3_three.js",
  ])

  t.eq(rename(files, "**/##/*.js"), [
    "a/b/01/one.js",
    "a/b/02/two.js",
    "a/b/03/three.js",
  ])
})

test("escaped hash", (t) => {
  t.eq(rename(files, "**/\\#.js"), [
    "a/b/#.js", //
    "a/b/#.js",
    "a/b/#.js",
  ])

  t.eq(rename(files, "**/\\##.js"), [
    "a/b/#1.js", //
    "a/b/#2.js",
    "a/b/#3.js",
  ])

  t.eq(rename(files, "**/\\#\\##.js"), [
    "a/b/##1.js", //
    "a/b/##2.js",
    "a/b/##3.js",
  ])
})

test("filter", (t) => {
  t.eq(rename(files, "**/_*{upperCase}_.js"), [
    "a/b/_ONE_.js",
    "a/b/_TWO_.js",
    "a/b/_THREE_.js",
  ])

  const allCaps = [
    "A/B/ONE.JS", //
    "A/B/TWO.JS",
    "A/B/THREE.JS",
  ]

  t.eq(rename(files, "**{upperCase}/*{upperCase}.*{upperCase}"), allCaps)
  t.eq(rename(files, "{upperCase}"), allCaps)
})

test("filter change case", (t) => {
  t.eq(rename("foo-bar/a-file.js", "**{camelCase}/_*{camelCase}_.js"), [
    "fooBar/_aFile_.js",
  ])
  t.eq(rename("foo bar/a file.js", "**{camelCase}/_*{camelCase}_.js"), [
    "fooBar/_aFile_.js",
  ])
  t.eq(rename("foo bar/a file.js", "**{snakeCase}/_*{snakeCase}_.js"), [
    "foo_bar/_a_file_.js",
  ])
})

test("filter change case from camel", (t) => {
  t.eq(rename("fooBar/aFile.js", "**{upperCase}/_*{upperCase}_.js"), [
    "FOO BAR/_A FILE_.js",
  ])
  t.eq(rename("fooBar/aFile.js", "**{kebabCase}/_*{kebabCase}_.js"), [
    "foo-bar/_a-file_.js",
  ])
})

test("deburr", (t) => {
  const expected = ["el nino/oscilacion.txt"]
  t.eq(rename("el niño/oscilación.txt", "**{deburr}/*{deburr}.*"), expected)
  t.eq(rename("EL NIÑO/OSCILACIÓN.TXT", "{deburr|lowerCase}"), expected)
  t.eq(rename("EL NIÑO/OSCILACIÓN.TXT", "{lowerCase|deburr}"), expected)
})

test("unknown filter", (t) => {
  t.eq(rename(files, "**/_*{not a filter}_.js"), [
    "a/b/_one{not a filter}_.js",
    "a/b/_two{not a filter}_.js",
    "a/b/_three{not a filter}_.js",
  ])
})

test("filter slice", (t) => {
  t.eq(rename(files, "**/_*{slice:0,2}_.js"), [
    "a/b/_on_.js",
    "a/b/_tw_.js",
    "a/b/_th_.js",
  ])

  t.eq(rename(files, "**/_*{slice:-2}_.js"), [
    "a/b/_ne_.js",
    "a/b/_wo_.js",
    "a/b/_ee_.js",
  ])

  t.eq(rename(files, "**/_*{slice:0,2|upperCase}_.js"), [
    "a/b/_ON_.js",
    "a/b/_TW_.js",
    "a/b/_TH_.js",
  ])
})

test("filter replace", (t) => {
  t.eq(rename(files, "**/_*{replace:t,d}_.js"), [
    "a/b/_one_.js",
    "a/b/_dwo_.js",
    "a/b/_dhree_.js",
  ])

  t.eq(rename("a space.txt", "**/_*{replace: ,_}_.*"), ["_a_space_.txt"])
})

test("filter replace regex", (t) => {
  t.eq(rename(files, "**/_*{replace:/E+/i,3}_.js"), [
    "a/b/_on3_.js",
    "a/b/_two_.js",
    "a/b/_thr3_.js",
  ])

  t.eq(rename(files, "**/_*{replace:/E/ig,3}_.js"), [
    "a/b/_on3_.js",
    "a/b/_two_.js",
    "a/b/_thr33_.js",
  ])
})

test("filter nospace", (t) => {
  const file = "a sentence\twith  spaces.txt"
  const expected = ["a_sentence_with_spaces.txt"]
  t.eq(rename(file, "**/*{nospace}.*"), expected)
  t.eq(rename(file, "{nospace}"), expected)

  t.eq(rename(file, "**/*{replace:/\\s+/g,_}.*"), expected)
  t.eq(rename(file, "{replace:/\\s+/g,_}"), expected)
})
