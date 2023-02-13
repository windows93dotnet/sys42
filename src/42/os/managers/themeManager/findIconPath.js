/* eslint-disable guard-for-in */
/* eslint-disable max-depth */
/* eslint-disable complexity */

import disk from "../../../core/disk.js"
import fs from "../../../core/fs.js"
import decodeINI from "../../../core/formats/ini/decodeINI.js"
import locate from "../../../fabric/locator/locate.js"
import getDirBasePair from "../../../core/path/core/getDirBasePair.js"
import parseMimetype from "../../../fabric/type/file/parseMimetype.js"

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

      return
    }

    val = { mime: parseMimetype(val) }
  }

  let { filename, ext, mime, protocol, host } = val

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
    if (ext.startsWith(".")) ext = ext.slice(1)
    for (const k in obj.ext) {
      if (k.includes(`${ext}.`) || k.includes(`${ext}_`)) {
        return `${themePath}/ext/${k}`
      }
    }
  }

  if (mime) {
    if (mime.subtype && "subtype" in obj) {
      for (const k in obj.subtype) {
        if (
          k.includes(`${mime.subtype}.`) ||
          k.includes(`${mime.subtype}_`) ||
          (mime.suffix && k.startsWith(`${mime.suffix}.`))
        ) {
          return `${themePath}/subtype/${k}`
        }
      }
    }

    if (mime.type && "type" in obj) {
      for (const k in obj.type) {
        if (k.includes(`${mime.type}.`) || k.includes(`${mime.type}_`)) {
          return `${themePath}/type/${k}`
        }
      }
    }
  }
}

export default async function findIconPath(themePath, val, size) {
  if (val.isDir && disk.has(val.pathname + ".directory")) {
    const ini = decodeINI(await fs.readText(val.pathname + ".directory"))
    val = ini["Desktop Entry"]?.Icon
  }

  const dirNode = disk.get(themePath)
  if (!dirNode) return

  if (size && size in dirNode) {
    const res = searchIcon(`${themePath}/${size}`, dirNode[size], val)
    if (res) return res
  }

  size = "32x32"
  return searchIcon(`${themePath}/${size}`, dirNode[size], val)
}
