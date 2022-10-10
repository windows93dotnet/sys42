export default {
  paths: {
    files: {
      scan: "/src/files.cbor",
      devScript: "/src/42/dev.js",
    },
    dirs: {
      src: "src",
    },
  },

  tasks: {
    scan: {
      stringify: "list",
    },

    watch: {
      glob: ["src/**/*"],
      globDev: ["src/**/*", "bin/**/*", "scripts/**/*"],
      ignore: [
        "**/dynamicImport.js",
        "**/themes/**/fonts/**",
        "**/scripts/pictos/**",
        "**/src/tests/fixtures/pictos.js",
      ],
      graph: false,
    },

    test: {
      // glob: [
      //   "**/fs.test.js",
      // ],
      ignore: [
        "**/normalizeAnnexDeclaration.test.js", //
        // "**/signature.test.js",
        "**/http.test.js",
        "**/load.test.js",
      ],

      frontend: {
        glob: [
          // "**/template.test.js",
          // "**/i18n.test.js",
          // "**/rename.test.js",
          "**/ui.test.js",
          // "**/shortcuts.test.js",
          // "**/fs.test.js",
        ],
        ignore: [
          // "**/fs.test.js",
          "**/repeater.test.js",
          // "**/Database.test.js",
          "**/formatFilename.test.js", //
        ],
      },

      backend: {
        ignore: [
          "**/html.test.js",
          "**/ui.test.js",
          "**/shortcuts.test.js",
          "**/ui/**/*.test.js",
          "**/dom/**/*.test.js",
          "**/traceBitmap.test.js",
          "**/isSerializable.test.js",
        ],
      },
      node: {
        // glob: [
        //   "**/bin/**/*.test.js", //
        // ],
        ignore: [
          "**/load.test.js", //
          "**/Database.test.js",
        ],
      },
      deno: {
        ignore: [
          "**/bin/tests/**", //
        ],
      },
      run: [
        "browser", //
        // "chromium",
        // "firefox",
        // "node",
        // "deno",
      ],
    },

    coverage: {
      ignore: [
        // "**/*.test.js", //
        "**/*.{demo,test}.js",
        "**/{tests,polyfill,vendor}/**/*.js",
        "**/html.js", //
        "**/svg.js",
      ],
    },
  },

  annexes: [
    {
      metaHeaders: false,
      src: "WICG/sanitizer-api",
      map: [
        [
          "resources/baseline-attribute-allow-list.json",
          "src/42/fabric/constants/ALLOWED_HTML_ATTRIBUTES.js",
          {
            head:
              "// @src https://github.com/WICG/sanitizer-api/blob/main/resources/baseline-attribute-allow-list.json" +
              "\n\nexport default Object.freeze(",
            foot: ")",
            replace: [
              "align",
              "alink",
              "background",
              "bgcolor",
              "border",
              "clear",
              "compact",
              "hspace",
              "language",
              "link",
              "nowrap",
              "start",
              "text",
              "type",
              "vlink",
              "vspace",
            ]
              .map((deprecated) => [`"${deprecated}",\n`, ""])
              .concat(['"face",', '"face",\n  "fetchpriority",']),
          },
        ],
        [
          "resources/baseline-element-allow-list.json",
          "src/42/fabric/constants/ALLOWED_HTML_TAGS.js",
          {
            head:
              "// @src https://github.com/WICG/sanitizer-api/blob/main/resources/baseline-element-allow-list.json" +
              "\n\nexport default Object.freeze(",
            foot: ")",
            replace: [
              "acronym",
              "applet",
              "b",
              "basefont",
              "bgsound",
              "big",
              "blink",
              "center",
              "command",
              "content",
              "dir",
              "embed",
              "font",
              "frame",
              "frameset",
              "hgroup",
              "i",
              "image",
              "isindex",
              "keygen",
              "marquee",
              "menu",
              "menuitem",
              "nobr",
              "noembed",
              "noframes",
              "param",
              "plaintext",
              "rb",
              "rtc",
              "s",
              "shadow",
              "spacer",
              "strike",
              "tt",
              "u",
              "xmp",
            ].map((deprecated) => [`"${deprecated}",\n`, ""]),
          },
        ],
      ],
    },

    /* Vendor
    ========= */

    {
      src: "golden-fleece",
      dest: "src/42/core/formats/json5.js",
      foot: "export default { ast: parse, parse: evaluate, format: patch, stringify }",
      eslint: { disable: true },
    },

    {
      src: "csstools/sanitize.css@main",
      dest: "src/42/themes/default/reset/",
      map: [
        "sanitize.css", //
        "reduce-motion.css",
      ],
    },

    {
      only: true,
      src: "faisalman/ua-parser-js@develop",
      map: [["src/ua-parser.js", "src/42/core/env/parseUserAgent.js"]],
      metaHeaders: false,
      eslint: {
        fix: true,
        disable: true,
      },
      bundle: {
        virtual: true,
        resolve: false,
        // minify: true,
      },
      replace: [
        [
          /^[\s\S]+\(function \(window, undefined\$1\) {\n/g,
          "//! Copyright © 2012-2021 Faisal Salman <f@faisalman.com>. MIT License.\n" +
            "// @src https://github.com/faisalman/ua-parser-js\n\n",
        ],
        [/var UAParser =/, "export const UAParser ="],
        [/undefined\$1/g, "undefined"],
        [/ \/\/\/? [^\n]*?\n/gi, "\n"],
        [
          /if \(typeof\(exports\) !== UNDEF_TYPE\) {[\s\S]+$/g,
          "\nexport default function uaParser(...args) {\n" +
            "  return Object.assign(Object.create(null), new UAParser(...args).getResult())\n" +
            "}\n",
        ],
      ],
    },

    /* Tests suites
    =============== */

    {
      src: "json-patch/json-patch-tests",
      dest: "src/tests/annexes/JSONPatchSuite.js",
      map: [
        "tests.json", //
        "spec_tests.json",
      ],
      concat: true,
    },

    {
      src: "https://spec.commonmark.org/0.30/spec.json",
      dest: "src/tests/annexes/commonmarkSuite.js",
      replace: [[/  "(start|end)_line": \d+,\n/g, ""]],
    },
  ],
}
