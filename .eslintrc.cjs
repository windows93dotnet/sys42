module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2021,
    sourceType: "module",
  },
  extends: [
    "xo",
    // "plugin:import/errors",
    // "plugin:import/warnings",
    "plugin:import/recommended",
    "plugin:unicorn/recommended",
    "prettier",
  ],
  plugins: ["unicorn", "eslint-plugin-html"],
  globals: {
    Deno: true,
    ClipboardItem: true,
    TransformStream: true,
    TextDecoderStream: true,
    TextEncoderStream: true,
    CompressionStream: true,
    DecompressionStream: true,
    DedicatedWorkerGlobalScope: true,
    SharedWorkerGlobalScope: true,
    system42: true,
  },
  env: {
    node: true,
    worker: true,
    serviceworker: true,
    browser: true,
    es2021: true,
  },
  settings: {
    "import/resolver": {
      node: {
        moduleDirectory: ["node_modules", "src"],
      },
    },
  },
  rules: {
    "curly": [2, "multi-line"],
    "func-names": [2, "as-needed"],

    "no-warning-comments": 0,
    "capitalized-comments": 0,
    "default-param-last": 0,
    "new-cap": [2, { properties: false }],
    "no-unused-expressions": [
      1,
      { allowTaggedTemplates: true, allowTernary: true },
    ],
    "no-promise-executor-return": 0,
    "no-constant-condition": [2, { checkLoops: false }],

    "no-labels": [2, { allowLoop: true }],

    "no-bitwise": 0,

    "lines-between-class-members": 0,

    // usefull with Arrow functions
    // @read https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void#non-leaking_arrow_functions
    "no-void": 0,

    "getter-return": [2, { allowImplicit: true }],

    // // make use of Object.create(null) easier
    // "guard-for-in": 0,

    // can't ignore performance gain
    "unicorn/prefer-math-trunc": 0,

    // too many legitimate uses
    "no-await-in-loop": 0,

    /* TODO: consider using theses rules */
    // "unicorn/no-unsafe-regex": 2,
    "unicorn/no-array-for-each": 0,
    "unicorn/prefer-code-point": 0,
    /* --- */

    // conflict with eqeqeq
    "unicorn/no-null": 0,
    "no-eq-null": 0,
    "eqeqeq": [2, "always", { null: "ignore" }],

    // false positives with BroadcastChannel
    "unicorn/require-post-message-target-origin": 0,

    "unicorn/relative-url-style": [2, "always"],
    "unicorn/prefer-dom-node-dataset": 0,
    "unicorn/no-thenable": 0,

    "unicorn/no-new-array": 0,
    "unicorn/no-hex-escape": 0,
    "unicorn/consistent-destructuring": 0,
    "unicorn/require-array-join-separator": 0,
    "unicorn/prefer-switch": 0,
    // "unicorn/prefer-node-protocol": 0,
    "unicorn/prefer-prototype-methods": 0,
    "unicorn/escape-case": 0,
    "unicorn/filename-case": 0,
    "unicorn/no-empty-file": 0,
    "unicorn/prevent-abbreviations": 0,
    "unicorn/prefer-add-event-listener": 0,
    "unicorn/catch-error-name": [2, { name: "err", ignore: ["^error$"] }],
    "unicorn/no-fn-reference-in-iterator": 0,
    "unicorn/no-await-expression-member": 0,
    "unicorn/prefer-regexp-test": 0,

    "unicorn/prefer-ternary": [2, "only-single-line"],
    "unicorn/prefer-number-properties": [2, { checkInfinity: false }],
    "unicorn/no-array-callback-reference": 0,
    "unicorn/prefer-spread": 0,
    "unicorn/error-message": 0,

    "import/no-unresolved": [2, { ignore: ["^https?://", "^node:"] }],
    "import/extensions": [2, "always", { ignorePackages: true }],
    "import/no-named-as-default": 0,
    "import/no-named-as-default-member": 0,
    "import/namespace": [2, { allowComputed: true }],
  },
}
