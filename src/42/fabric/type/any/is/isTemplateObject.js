if ("isTemplateObject" in globalThis.Array === false) {
  await import("../../../../system/env/polyfills/Array.isTemplateObject.js")
}

export default function isTemplateObject(val) {
  return Array.isTemplateObject(val)
}
