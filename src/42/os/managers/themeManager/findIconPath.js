/* eslint-disable guard-for-in */
/* eslint-disable max-depth */
/* eslint-disable complexity */

import disk from "../../../core/disk.js"
import locate from "../../../fabric/locator/locate.js"
import getDirBasePair from "../../../core/path/core/getDirBasePair.js"

function searchIcon(themePath, obj, val) {
  if (typeof val === "string") {
    if (val.includes("/")) {
      const { dir, base } = getDirBasePair(val)
      const r = locate(obj, dir, "/")
      if (r) {
        for (const k in r) {
          if (k.startsWith(`${base}.`)) return `${themePath}/${dir}/${k}`
        }
      }
    } else {
      for (const key in obj) {
        for (const k in obj[key]) {
          if (k.startsWith(`${val}.`)) return `${themePath}/${key}/${k}`
        }
      }
    }

    return
  }

  const { filename, ext, mime, protocol, host } = val

  if (protocol?.startsWith("http")) {
    if ("host" in obj) {
      for (const k in obj.host) {
        if (k.startsWith(`${host}.`)) return `${themePath}/host/${k}`
      }
    }

    if ("ext" in obj) {
      for (const k in obj.ext) {
        if (k.startsWith(`url.`)) return `${themePath}/ext/${k}`
      }
    }

    return
  }

  if (filename?.endsWith("/")) {
    if ("places" in obj) {
      for (const k in obj.places) {
        if (k.startsWith(`folder.`)) return `${themePath}/places/${k}`
      }
    }

    return
  }

  if (ext && "ext" in obj) {
    for (const k in obj.ext) {
      if (k.startsWith(`${ext}.`)) return `${themePath}/ext/${k}`
    }
  }

  if (mime) {
    if (mime.subtype && "subtype" in obj) {
      for (const k in obj.subtype) {
        if (
          k.startsWith(`${mime.subtype}.`) ||
          (mime.suffix && k.startsWith(`${mime.suffix}.`))
        ) {
          return `${themePath}/subtype/${k}`
        }
      }
    }

    if (mime.type && "type" in obj) {
      for (const k in obj.type) {
        if (k.startsWith(`${mime.type}.`)) return `${themePath}/type/${k}`
      }
    }
  }
}

export default function findIconPath(themePath, val, size) {
  const obj = disk.get(themePath)
  if (!obj) return

  if (size && size in obj) {
    const res = searchIcon(`${themePath}/${size}`, obj[size], val)
    if (res) return res
  }

  return searchIcon(themePath, obj, val)
}
