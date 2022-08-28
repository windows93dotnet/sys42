module.exports = {
  // plugins: ["stylelint-import"],
  extends: ["stylelint-config-standard"],
  rules: {
    "declaration-block-single-line-max-declarations": 3,
    "alpha-value-notation": "number",

    "custom-property-pattern": null,
    "declaration-empty-line-before": null,

    // "import/rule": true,

    "custom-property-empty-line-before": null,
    "comment-empty-line-before": null,

    // alow empty variable https://github.com/postcss/postcss/issues/1404
    // "declaration-block-semicolon-space-before": null,
    // "declaration-colon-space-after": null,

    "selector-class-pattern": null,
    "media-feature-name-no-vendor-prefix": null,

    "comment-no-empty": null,
    "selector-list-comma-newline-after": null,
    "property-no-vendor-prefix": null,
    "value-no-vendor-prefix": null,
    "no-descending-specificity": null,

    "value-keyword-case": null,

    "number-max-precision": null,
    "length-zero-no-unit": [true, { ignore: ["custom-properties"] }],
    "property-no-unknown": [true, { ignoreProperties: [/^font-smooth/] }],
  },
}
