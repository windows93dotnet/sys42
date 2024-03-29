import { fileURLToPath, pathToFileURL } from "node:url"
import { lilconfig } from "lilconfig"

import CLI from "../classes/CLI.js"
import { Log } from "../../src/42/core/log.js"
import normalizeConfig from "./userConfig/normalizeConfig.js"
import normalizePaths from "./userConfig/normalizePaths.js"
import configure from "../../src/42/core/configure.js"

import normalizeTestContexts, {
  TEST_CTX,
} from "./userConfig/normalizeTestContexts.js"

function resolve(path) {
  return fileURLToPath(new URL(path, import.meta.url))
}

export const CLI_TASKS = [
  ["🚀", "serve", "cyanBright"],
  ["🔭", "watch", "blueBright"],
  // ["🧪", "test", "green"],
  // ["🪐", "coverage", "yellow"],
  // ["🛸", "annex", "cyan"],
  // ["📦", "build", "yellowBright"],
  ["🔬", "scan", "magentaBright"],
  ["🧰", "kit", "redBright"],
  // ["⚡", "run", "magenta"],
]

const SUBCOMMANDS = CLI_TASKS.map((x) => x[1])

const dirRoot = resolve("../../").slice(0, -1)
const dirLib = dirRoot + "/src"
const dirBin = dirRoot + "/bin"

// [1] defaults in ../../src/42/tool/testRunner.js
// [2] defaults in ./automatedBrowser.js

const DEFAULTS = {
  dev: false,
  greet: true,
  cwd: process.cwd(),
  host: "",
  verbose: 1,
  ignore: "**/_*",

  tasks: {
    watch: {
      verbose: undefined,
      glob: "**/*",
      globDev: "**/*",
      graph: {
        glob: "**/*.js",
      },
    },

    serve: {
      verbose: undefined,
      port: 4200,
      timeout: 3000,
      log: {
        200: "**/*",
        404: "**/*",
        500: "**/*",
      },
    },

    scan: {
      verbose: undefined,
      glob: "**/*",
      stringify: "min",
    },

    kit: {
      verbose: undefined,
      glob: "**/*",
      ignore: ["tests/**", "**/*.test.js"],
      maxSize: 1.5 * 1024 ** 2, // 1.5 MiB
    },

    test: {
      verbose: undefined,
      glob: "**/*.test.{js,html}",
      runner: {}, // [1]
      serializer: {}, // [1]
      reporter: {}, // [1]
      automated: {}, // [2]
      frontend: { verbose: undefined, glob: undefined },
      backend: { verbose: undefined, glob: undefined },

      chromium: {},
      firefox: {},
      // webkit: {},
      // electron: {},
      node: {},
      deno: {},

      run: [
        "browser", //
        "chromium",
      ],
    },

    coverage: {
      verbose: undefined,
      ignore: "**/*.test.js",
      glob: "**/*.js",
      heatmap: false,
      uncovered: true,
      heatMinThreshold: 64,
      heatMidThreshold: 512,
      heatMaxThreshold: 1024,
    },

    annex: {
      verbose: undefined,
    },

    run: {
      glob: "scripts/*.js",
      verbose: undefined,
    },
  },

  paths: {
    files: {
      config: "",
      scan: "",
      devScript: "/42/dev.js",
    },
    dirs: {
      src: ".",
      scripts: "scripts",
      dist: "dist",
      tmp: ".tmp",
    },
  },

  prettier: {},
}

const cli = new CLI("verbose", {
  schema: {
    coverage: { type: "boolean" },
  },
  globalOptions: [
    "silent", //
    "dev",
    "greet",
  ],
  aliases: {
    A: "all",
    c: "coverage",
  },
  subcommands: {
    "tasks": SUBCOMMANDS,
    "tasks.test.ctx": TEST_CTX,
  },
  argsKey: "glob",
})

const lilconfigOptions = {
  cache: false,
  loaders: {
    async ".js"(filepath) {
      return (await import(/* graph-ignore */ pathToFileURL(filepath))).default
    },
  },
}
const configExplorerPrettier = lilconfig("prettier", lilconfigOptions)
const configExplorer42 = lilconfig("42", lilconfigOptions)

export default async function userConfig(args) {
  const prettierConfig = await configExplorerPrettier.search()
  const configFile = await configExplorer42.search()

  const ignore = []

  if (args.filter((x) => SUBCOMMANDS.includes(x)).length === 0) {
    args.push("watch", "scan", "kit", /* "test", "coverage", */ "serve")
  } else if (args.includes("--dev") && !args.includes("watch")) {
    args.push("watch")
  }

  if (args.includes("coverage") && !args.includes("test")) {
    args.push("test")
    ignore.push("test")
  }

  if (args.includes("test") && !args.includes("serve")) {
    args.push("serve")
    ignore.push("serve")
  }

  const configCmd = cli(args)

  const configUser = configure(configFile ? configFile.config : {}, configCmd)

  const configMerged = configure(
    DEFAULTS, //
    configUser,
    { prettier: prettierConfig ? prettierConfig.config : {} },
  )

  normalizeTestContexts(configMerged.tasks.test)

  const config = normalizeConfig(configMerged)
  config.paths = normalizePaths(config.cwd, config.paths)

  config.paths.dirs.lib = dirLib
  config.paths.dirs.bin = dirBin
  config.paths.dirs.root = dirRoot
  config.paths.dirs.cwd = config.cwd

  config.paths.files.config = configFile ? configFile.filepath : ""

  config.tasks.serve.host ??= `http://localhost:${config.tasks.serve.port}`
  config.host = config.tasks.serve.host
  config.paths.host = config.host

  /* coverage
  =========== */

  const { coverage } = config.tasks
  if (
    coverage.heatMidThreshold < coverage.heatMinThreshold ||
    coverage.heatMidThreshold > coverage.heatMaxThreshold
  ) {
    coverage.heatMidThreshold =
      coverage.heatMinThreshold +
      (coverage.heatMaxThreshold - coverage.heatMinThreshold) / 2
  }

  config.run = []

  for (const [icon, name, color] of CLI_TASKS) {
    const taskConfig = { name, icon, color }
    config.tasks[name] = { ...config.tasks[name], ...taskConfig }
    if (args.includes(name)) config.run.push(name)
  }

  config.ignore = ignore

  for (const name of config.ignore) config.tasks[name].verbose = 0

  for (const name of config.run) {
    const task = config.tasks[name]
    const log = new Log(task.verbose)
    config.tasks[name].log = log[task.color].hour.prefix("┃ " + task.icon)
  }

  return config
}
