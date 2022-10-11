import ConfigFile from "./class/ConfigFile.js"
import parseMimetype from "../fabric/type/file/parseMimetype.js"

class FileTypesManager extends ConfigFile {
  async populate() {
    this.value = await import("../fabric/constants/FILE_TYPES_2.js") //
      .then((m) => m.default)
  }

  resolveMimetype(mimetype, exts) {
    const { type, subtypefull } = parseMimetype(mimetype)

    const out = {}

    if (type in this.value.mimetypes) {
      if (subtypefull === "*") {
        for (const key in this.value.mimetypes[type]) {
          if (Object.hasOwn(this.value.mimetypes[type], key)) {
            out[`${type}/${key}`] = [
              ...(exts ?? []),
              ...this.value.mimetypes[type][key],
            ]
          }
        }
      } else if (subtypefull in this.value.mimetypes[type]) {
        out[`${type}/${subtypefull}`] = [
          ...(exts ?? []),
          ...this.value.mimetypes[type][subtypefull],
        ]
      }
    }

    return out
  }

  resolve(mimetypes) {
    const out = {}
    for (const key in mimetypes) {
      if (Object.hasOwn(mimetypes, key)) {
        Object.assign(out, this.resolveMimetype(key, mimetypes[key]))
      }
    }

    return out
  }
}

const fileTypesManager = new FileTypesManager("mimetypes.json")
await fileTypesManager.init()

export default fileTypesManager
