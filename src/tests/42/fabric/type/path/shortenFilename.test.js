import test from "../../../../../42/test.js"
import shortenFilename from "../../../../../42/fabric/type/path/shortenFilename.js"
import resolvePath from "../../../../../42/fabric/type/path/core/resolvePath.js"

// console.log(111, resolvePath(`tests/log.test.js`))

test.tasks(
  [
    {
      path: "https://localhost:4200/tests/xxx.test.js",
      backend: "./src/tests/xxx.test.js",
      frontend: "/tests/xxx.test.js",
    },
    {
      path: resolvePath(`tests/a.test.js`),
      backend: "./tests/a.test.js",
      frontend: "/tests/a.test.js",
    },
    {
      path: "/tests/b.test.js",
      backend: "./src/tests/b.test.js",
      frontend: "/tests/b.test.js",
    },
    {
      path: "/",
      backend: "./src/",
      frontend: "/",
    },
    {
      path: "",
      backend: "./src/",
      frontend: "/",
    },
    {
      path: ".",
      backend: "./src/",
      frontend: "/",
    },
  ],

  ({ path, expected, frontend, backend }) => {
    if (expected) {
      test(path, (t) => {
        t.is(shortenFilename(path), expected)
      })
    } else {
      if (backend && test.env.runtime.isBackend) {
        test(path, "backend", (t) => {
          t.is(shortenFilename(path), backend)
        })
      }

      if (frontend && test.env.runtime.isFrontend) {
        test(path, "frontend", (t) => {
          t.is(shortenFilename(path), frontend)
        })
      }
    }
  }
)
