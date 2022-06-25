import test from "../../../42/test.js"
import log from "../../../42/system/log.js"

import ansi from "../../../42/system/console/stylizers/ansi.js"
import devtool from "../../../42/system/console/stylizers/devtool.js"

const print = 0

function makeConsoleSpy(t, type = "log") {
  return t.spy(
    globalThis.console,
    type,
    function (...args) {
      if (print) this.original.method(...args)
    },
    false
  )
}

const originalDevtoolConfig = devtool.config
const originalVerbose = log.verbose
const originalStylizer = log.stylizer

test.setup(() => {
  // Force devtool stylizer in automated browser test context
  log.stylizer = test.env.runtime.isFrontend ? devtool : ansi
  devtool.configure({
    css: "font-size:12px; ",
    colors: {
      dim: "rgba(160,160,160,0.8)",
      black: "black",
      red: "red",
      green: "lime",
      yellow: "yellow",
      blue: "blue",
      magenta: "magenta",
      cyan: "cyan",
      white: "white",
      blackBright: "#999",
      redBright: "rgb(255,85,85)",
      greenBright: "rgb(85,255,85)",
      yellowBright: "rgb(255,255,85)",
      blueBright: "rgb(85,85,255)",
      magentaBright: "#b280f6",
      cyanBright: "rgb(85,255,255)",
      whiteBright: "rgb(255,255,255)",
    },
  })
})

test.teardown(() => {
  log.verbose = originalVerbose
  log.stylizer = originalStylizer
  devtool.configure(originalDevtoolConfig)
})

test("ansi and devtool have the same list of chainable getters and methods", (t) => {
  const GETTERS = Symbol.for("chainable.GETTERS")
  const METHODS = Symbol.for("chainable.METHODS")
  const ansiGetters = [...ansi[GETTERS]].sort()
  const devtoolGetters = [...devtool[GETTERS]].sort()
  t.eq(ansiGetters, devtoolGetters)
  const ansiMethods = [...Object.keys(ansi[METHODS])].sort()
  const devtoolMethods = [...Object.keys(ansi[METHODS])].sort()
  t.eq(ansiMethods, devtoolMethods)
})

test("bug", () => {
  log.red("{i:false}")
})

test.tasks(
  [
    {
      description: "simple",
      fn() {
        log.yellow(`{green A {red B} C} D`)
      },
      args: {
        backend: [
          "\x1b[33;32mA \x1b[39m\x1b[33;32;31mB\x1b[39m\x1b[33;32m C\x1b[39m\x1b[33m D\x1b[39m",
        ],
        frontend: [
          "%cA %cB%c C%c D",
          "font-size:12px; color:yellow;color:lime;",
          "font-size:12px; color:yellow;color:lime;color:red;",
          "font-size:12px; color:yellow;color:lime;",
          "font-size:12px; color:yellow;",
        ],
      },
    },

    {
      description: "dim",
      fn() {
        log(`{dim.red A }{red B }{dim.red C }{cyan D}`)
        log.red(`{dim A }B {dim C }{cyan D}`)
        log.dim.red(`A {reset.red B }C {reset.cyan D}`)
      },
      calls: {
        backend: [
          {
            args: [
              "\x1b[2;31mA \x1b[39;22m\x1b[31mB \x1b[39m\x1b[2;31mC \x1b[39;22m\x1b[36mD\x1b[39m",
            ],
          },
          {
            args: [
              "\x1b[31;2mA \x1b[22;39m\x1b[31mB \x1b[39m\x1b[31;2mC \x1b[22;39m\x1b[31;36mD\x1b[39m",
            ],
          },
          {
            args: [
              "\x1b[2;31mA \x1b[39;22m\x1b[31mB \x1b[39m\x1b[2;31mC \x1b[39;22m\x1b[36mD\x1b[39m",
            ],
          },
        ],
        frontend: [
          {
            args: [
              "%cA %cB %cC %cD",
              "font-size:12px; color:rgba(255,0,0,0.5);",
              "font-size:12px; color:red;",
              "font-size:12px; color:rgba(255,0,0,0.5);",
              "font-size:12px; color:cyan;",
            ],
          },
          {
            args: [
              "%cA %cB %cC %cD",
              "font-size:12px; color:rgba(255,0,0,0.5);",
              "font-size:12px; color:red;",
              "font-size:12px; color:rgba(255,0,0,0.5);",
              "font-size:12px; color:red;color:cyan;",
            ],
          },
          {
            args: [
              "%cA %cB %cC %cD",
              "font-size:12px; color:rgba(255,0,0,0.5);",
              "font-size:12px; color:red;",
              "font-size:12px; color:rgba(255,0,0,0.5);",
              "font-size:12px; color:cyan;",
            ],
          },
        ],
      },
    },

    {
      description: "bright",
      fn() {
        log(`{bright.magenta A }{magenta B }{bright.magenta C }{cyan D}`)
        log.magenta(`{bright.magenta A }B {bright.magenta C }{cyan D}`)
        log.bright.magenta(`A {reset.magenta B }C {reset.cyan D}`)
      },
      calls: {
        backend: [
          {
            args: [
              "\x1b[95mA \x1b[39m\x1b[35mB \x1b[39m\x1b[95mC \x1b[39m\x1b[36mD\x1b[39m",
            ],
          },
          {
            args: [
              "\x1b[35;95mA \x1b[39m\x1b[35mB \x1b[39m\x1b[35;95mC \x1b[39m\x1b[35;36mD\x1b[39m",
            ],
          },
          {
            args: [
              "\x1b[95mA \x1b[39m\x1b[35mB \x1b[39m\x1b[95mC \x1b[39m\x1b[36mD\x1b[39m",
            ],
          },
        ],
        frontend: [
          {
            args: [
              "%cA %cB %cC %cD",
              "font-size:12px; color:#b280f6;",
              "font-size:12px; color:magenta;",
              "font-size:12px; color:#b280f6;",
              "font-size:12px; color:cyan;",
            ],
          },
          {
            args: [
              "%cA %cB %cC %cD",
              "font-size:12px; color:magenta;color:#b280f6;",
              "font-size:12px; color:magenta;",
              "font-size:12px; color:magenta;color:#b280f6;",
              "font-size:12px; color:magenta;color:cyan;",
            ],
          },
          {
            args: [
              "%cA %cB %cC %cD",
              "font-size:12px; color:#b280f6;",
              "font-size:12px; color:magenta;",
              "font-size:12px; color:#b280f6;",
              "font-size:12px; color:cyan;",
            ],
          },
        ],
      },
    },

    {
      description: "nested background",
      fn: () => log.dim.blue.bright.bg.magenta(" hello {bg.magenta  world } "),
      args: {
        backend: [
          "\x1b[2;34;105m hello \x1b[49;39;22m\x1b[2;34;105;45m world \x1b[49;39;22m\x1b[2;34;105m \x1b[49;39;22m",
        ],
        frontend: [
          "%c hello %c world %c ",
          "font-size:12px; color:rgba(0,0,255,0.5);background-color:#b280f6;",
          "font-size:12px; color:rgba(0,0,255,0.5);background-color:#b280f6;background-color:magenta;",
          "font-size:12px; color:rgba(0,0,255,0.5);background-color:#b280f6;",
        ],
      },
    },

    {
      description: "user defined colors",
      fn() {
        log.color("#c3ff00").bg.color("#111")(" hello ")
        log.bg.color("#111").color("#c3ff00")(" hello ")
      },
      calls: {
        backend: [
          { args: ["\x1b[38;2;195;255;0;48;2;17;17;17m hello \x1b[49;39m"] },
          { args: ["\x1b[48;2;17;17;17;38;2;195;255;0m hello \x1b[39;49m"] },
        ],
        frontend: [
          {
            args: [
              "%c hello ",
              "font-size:12px; color:rgba(195,255,0,1);background-color:rgba(17,17,17,1);",
            ],
          },
          {
            args: [
              "%c hello ",
              "font-size:12px; background-color:rgba(17,17,17,1);color:rgba(195,255,0,1);",
            ],
          },
        ],
      },
    },

    {
      description: "escape %c",
      fn() {
        log.red("A %c {green D C}")
      },
      args: {
        frontend: [
          "%cA %%c %cD C",
          "font-size:12px; color:red;",
          "font-size:12px; color:red;color:lime;",
        ],
      },
    },

    {
      description: "keep global style after nested",
      fn() {
        log.cyan.bg.blue(`
     \n\
█{bg.red ▀}█  \n\
█{white.bg.red ▀}█  \n\
     \n\
`)
      },
      args: {
        backend: [
          "\n\x1b[36;44m     \x1b[49;39m\n\x1b[36;44m█\x1b[49;39m\x1b[36;44;41m▀\x1b[49;39m\x1b[36;44m█  \x1b[49;39m\n\x1b[36;44m█\x1b[49;39m\x1b[36;44;37;41m▀\x1b[49;39m\x1b[36;44m█  \x1b[49;39m\n\x1b[36;44m     \x1b[49;39m\n",
        ],
        frontend: [
          "%c\n     \n█%c▀%c█  \n█%c▀%c█  \n     \n",
          "font-size:12px; color:cyan;background-color:blue;",
          "font-size:12px; color:cyan;background-color:blue;background-color:red;",
          "font-size:12px; color:cyan;background-color:blue;",
          "font-size:12px; color:cyan;background-color:blue;color:white;background-color:red;",
          "font-size:12px; color:cyan;background-color:blue;",
        ],
      },
    },

    {
      description: "technicolor",
      fn() {
        log.bg.color("#000").color("#fff")(`
                    \n\
         ▄▄████▄▄   \n\
  █ ▄ ▄▄██{bg.c3ff00 ▀{000 ▄  ▄}▀}██  \n\
  {0ff ▄} ▀▀▀▀██{bg.c3ff00  {000 ▀  ▀} }██  \n\
  {0ff ▀ █▄██}██{bg.c3ff00  {000 ▄  ▄} }██  \n\
  {f0f █ ▄ ▄▄}██{bg.c3ff00  {000  ▀▀ } }██  \n\
  ▄ {f0f ▀▀▀▀}██{bg.c3ff00 ▄████▄}██  \n\
  ▀ █▄███▀▀    ▀▀█  \n\
                    \n\
`)

        log.color("#000")(`

         ▄▄████▄▄
  █ ▄ ▄▄██{bg.c3ff00 ▀▄  ▄▀}██
  {0ff ▄} ▀▀▀▀██{bg.c3ff00  ▀  ▀ }██
  {0ff ▀ █▄██}██{bg.c3ff00  ▄  ▄ }██
  {f0f █ ▄ ▄▄}██{bg.c3ff00   ▀▀  }██
  ▄ {f0f ▀▀▀▀}██{bg.c3ff00 ▄████▄}██
  ▀ █▄███▀▀    ▀▀█

`)
      },
    },
  ],

  ({ description, fn, calls, args }) => {
    test(description ?? fn.toString(), (t) => {
      const spy = makeConsoleSpy(t)

      fn()
      // t.pass()

      if (calls) {
        if (test.env.runtime.isBackend && calls.backend) {
          t.eq(spy.calls, calls.backend)
        } else if (test.env.runtime.isFrontend && calls.frontend) {
          t.eq(spy.calls, calls.frontend)
        } else t.pass()
      } else if (args) {
        if (test.env.runtime.isBackend && args.backend) {
          t.eq(spy.calls[0].args, args.backend)
        } else if (test.env.runtime.isFrontend && args.frontend) {
          t.eq(spy.calls[0].args, args.frontend)
        } else t.pass()
      } else t.pass()
    })
  }
)
