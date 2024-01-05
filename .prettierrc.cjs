module.exports = {
  plugins: ["./node_modules/prettier-plugin-jsdoc/dist/index.js"],
  jsdocPrintWidth: 900,
  jsdocTagsOrder:
    '{"author":15.1, "license":15.2, "source":15.3, "thanks":15.4}',

  semi: false,
  quoteProps: "consistent",
  bracketSameLine: true,
  overrides: [
    {
      files: "*.json",
      options: {
        printWidth: 900,
      },
    },
  ],
}
