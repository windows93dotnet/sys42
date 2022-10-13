export default {
  name: "Sandbox",
  command: "sandbox",
  categories: ["utilities", "productivity", "development"],

  decode: {
    types: [
      { description: "HTML Pages", accept: "text/html" },
      { description: "Audio", accept: "audio/*" },
      { description: "Video", accept: "video/*" },
      { description: "Image", accept: "image/*" },
      { description: "Any", accept: "application/*" },
    ],
  },

  installable: false, // TODO: implement this
  inset: true,
  path: "{{$files/0/path}}",
}
