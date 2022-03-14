export default function getGPU() {
  const gpu = {
    supported: "WebGLRenderingContext" in globalThis,
    active: false,
    vendor: undefined,
    model: undefined,
  }

  //! Copyright © 2012-2021 Faisal Salman <f@faisalman.com>. MIT License.
  // @src http://faisalman.github.io/ua-parser-js/js/ua-parser.js
  const GPU_VENDOR_REGEX = /(intel|nvidia|sis|amd|apple|powervr)\W? (.+)/i
  const GPU_RENDERER_REGEX = /(((?:radeon|adreno|geforce|mali).+))/i
  const GPU_CLEANUP_REGEX = / ?(\(.+?\)| direct3d.+| opengl.+|\/.+$| gpu$)/gi

  const canvas = document.createElement("canvas")
  const gl = canvas.getContext
    ? canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    : undefined

  if (gl) {
    gpu.active = true
    const info = gl.getExtension("WEBGL_debug_renderer_info")
    gpu.vendor = gl.getParameter(info.UNMASKED_VENDOR_WEBGL)
    const renderer = gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? ""
    const vendorMathes = renderer.match(GPU_VENDOR_REGEX)
    const modelMathes = renderer.match(GPU_RENDERER_REGEX)
    if (vendorMathes) gpu.vendor = vendorMathes[1]
    gpu.model = modelMathes ? modelMathes[1] : renderer
    gpu.model = gpu.model.replace(GPU_CLEANUP_REGEX, "")
  }

  return gpu
}
