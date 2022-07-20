if ("isTemplateObject" in globalThis.Array === false) {
  await import("../../../../core/env/polyfills/Array.isTemplateObject.js")
}

export default function isTemplateObject(val) {
  return Array.isTemplateObject(val)
}
