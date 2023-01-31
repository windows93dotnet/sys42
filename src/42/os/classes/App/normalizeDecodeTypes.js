/* eslint-disable camelcase */

import mimetypesManager from "../../managers/mimetypesManager.js"

export async function normalizeDecodeTypes(manifest) {
  function resolve(url) {
    return new URL(url, manifest.dir).href
  }

  manifest.decode.types = manifest.decode.types.map((type) => {
    const out = {}
    out.action = type.action ?? resolve(".")

    out.accept = Array.isArray(type.accept)
      ? mimetypesManager.resolve(type.accept)
      : type.accept

    if (type.icons) out.icons = type.icons
    if (type.launch_type) out.launch_type = type.launch_type
    return out
  })
}

export default normalizeDecodeTypes
