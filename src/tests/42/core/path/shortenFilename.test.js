import test from "../../../../42/test.js"
import shortenFilename from "../../../../42/core/path/shortenFilename.js"
import resolvePath from "../../../../42/core/path/core/resolvePath.js"

const { task } = test

test.tasks(
  [
    task({
      path: "http://localhost:4200/tests/xxx.test.js",
      backend: "./src/tests/xxx.test.js",
      frontend: "/tests/xxx.test.js",
    }),
    task({
      path: resolvePath(`tests/a.test.js`),
      backend: "./tests/a.test.js",
      frontend: "/tests/a.test.js",
    }),
    task({
      path: "/tests/b.test.js",
      backend: "./src/tests/b.test.js",
      frontend: "/tests/b.test.js",
    }),
    task({
      path: "/",
      backend: "./src/",
      frontend: "/",
    }),
    task({
      path: "",
      backend: "./src/",
      frontend: "/",
    }),
    task({
      path: ".",
      backend: "./src/",
      frontend: "/",
    }),
  ],

  (test, { path, expected, frontend, backend }) => {
    if (expected) {
      test(path, (t) => {
        t.is(shortenFilename(path), expected)
      })
    } else {
      if (backend && test.env.runtime.inBackend) {
        test(path, "backend", (t) => {
          t.is(shortenFilename(path), backend)
        })
      }

      if (frontend && test.env.runtime.inFrontend) {
        test(path, "frontend", (t) => {
          t.is(shortenFilename(path), frontend)
        })
      }
    }
  },
)
