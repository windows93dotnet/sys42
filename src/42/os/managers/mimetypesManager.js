import ConfigFile from "../classes/ConfigFile.js"
import parseMimetype from "../../fabric/type/file/parseMimetype.js"

class FileTypesManager extends ConfigFile {
  async populate() {
    this.value = await import("../../fabric/constants/FILE_TYPES.js") //
      .then((m) => m.default)
  }

  resolveMimetype(mimetype, exts) {
    const { type, subtype } = parseMimetype(mimetype)

    const out = {}

    if (type in this.value.mimetypes) {
      if (subtype === "*") {
        for (const key in this.value.mimetypes[type]) {
          if (Object.hasOwn(this.value.mimetypes[type], key)) {
            out[`${type}/${key}`] = [
              ...(exts ?? []),
              ...this.value.mimetypes[type][key],
            ]
          }
        }
      } else if (subtype in this.value.mimetypes[type]) {
        out[`${type}/${subtype}`] = [
          ...(exts ?? []),
          ...this.value.mimetypes[type][subtype],
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
