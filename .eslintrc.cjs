module.exports = {
  root: true,
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2022,
    sourceType: "module",
  },
  extends: [
    "xo",
    "plugin:import/recommended",
    "plugin:unicorn/recommended",
    "prettier",
  ],
  plugins: ["unicorn", "eslint-plugin-html"],
  globals: {
    Deno: true,
    Sanitizer: true,
    ClipboardItem: true,
    TransformStream: true,
    TextDecoderStream: true,
    TextEncoderStream: true,
    CompressionStream: true,
    DecompressionStream: true,
    DedicatedWorkerGlobalScope: true,
    SharedWorkerGlobalScope: true,
    ReportingObserver: true,
    sys42: true,
    $app: true,
    $files: true,
    $manifest: true,
  },
  env: {
    node: true,
    worker: true,
    serviceworker: true,
    browser: true,
    es2022: true,
  },
  settings: {
    "import/resolver": {
      node: {
        moduleDirectory: ["node_modules", "src"],
      },
    },
  },
  overrides: [
    {
      files: ["src/**/*.js"],
      rules: {
        "no-buffer-constructor": 0,
        "unicorn/no-new-buffer": 0,
      },
    },
  ],
  rules: {
    "curly": [2, "multi-line"],
    "func-names": 0,

    "no-warning-comments": 0,
    "capitalized-comments": 0,
    "default-param-last": 0,
    "no-bitwise": 0,
    "lines-between-class-members": 0,
    "new-cap": [2, { properties: false }],
    "no-promise-executor-return": 0,
    "no-constant-condition": [2, { checkLoops: false }],
    "no-unused-expressions": [
      1,
      { allowTaggedTemplates: true, allowTernary: true },
    ],

    "no-labels": [2, { allowLoop: true }],
    "getter-return": [2, { allowImplicit: true }],

    // usefull with Arrow functions
    // @read https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/void#non-leaking_arrow_functions
    "no-void": 0,
    "no-return-assign": [2, "except-parens"],

    // too many legitimate uses
    "no-await-in-loop": 0,

    // make debug harder with autofix
    "unicorn/no-lonely-if": 0,

    // can't ignore performance gain
    "unicorn/prefer-math-trunc": 0,

    /* TODO: consider using theses rules */
    "unicorn/no-unsafe-regex": 0,
    "unicorn/no-array-for-each": 0,
    "unicorn/prefer-code-point": 0,
    /* --- */

    // conflict with eqeqeq
    "unicorn/no-null": 0,
    "no-eq-null": 0,
    "eqeqeq": [2, "always", { null: "ignore" }],

    // browser Buffer !== node Buffer
    "no-buffer-constructor": 0,
    "unicorn/no-new-buffer": 0,

    // Allow `await 0` as queueMicroTack
    "unicorn/no-unnecessary-await": 0,

    // false positives with BroadcastChannel
    "unicorn/require-post-message-target-origin": 0,

    "unicorn/prefer-top-level-await": 0,
    "unicorn/relative-url-style": [2, "always"],
    "unicorn/prefer-dom-node-dataset": 0,
    "unicorn/no-thenable": 0,
    "unicorn/text-encoding-identifier-case": 0,
    "unicorn/switch-case-braces": 0,

    "unicorn/no-new-array": 0,
    "unicorn/no-hex-escape": 0,
    "unicorn/consistent-destructuring": 0,
    "unicorn/require-array-join-separator": 0,
    "unicorn/prefer-switch": 0,
    "unicorn/prefer-prototype-methods": 0,
    "unicorn/escape-case": 0,
    "unicorn/filename-case": 0,
    "unicorn/no-empty-file": 0,
    "unicorn/prevent-abbreviations": 0,
    "unicorn/prefer-add-event-listener": 0,
    "unicorn/catch-error-name": [
      2,
      { name: "err", ignore: ["^(error|cause)$"] },
    ],
    "unicorn/no-fn-reference-in-iterator": 0,
    "unicorn/no-await-expression-member": 0,
    "unicorn/prefer-regexp-test": 0,

    "unicorn/prefer-ternary": [2, "only-single-line"],
    "unicorn/prefer-number-properties": [2, { checkInfinity: false }],
    "unicorn/no-array-callback-reference": 0,
    "unicorn/prefer-spread": 0,
    "unicorn/error-message": 0,

    "unicorn/prefer-export-from": [2, { ignoreUsedVariables: true }],
    "import/no-unresolved": [2, { ignore: ["^/", "^https?://", "^node:"] }],
    "import/extensions": [2, "always", { ignorePackages: true }],
    "import/no-named-as-default": 0,
    "import/no-named-as-default-member": 0,
    "import/namespace": [2, { allowComputed: true }],
  },
}
