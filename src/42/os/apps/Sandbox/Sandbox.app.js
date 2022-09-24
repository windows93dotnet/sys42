export default {
  name: "Sandbox",
  command: "sandbox",

  categories: ["utilities", "productivity", "development"],

  decode: {
    types: [{ description: "HTML Pages", accept: { "text/html": [".html"] } }],
  },

  inset: true,
  path: "{{$files/0/path}}",
}
