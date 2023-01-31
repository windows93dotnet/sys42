/* eslint-disable max-depth */
import ConfigFile from "../classes/ConfigFile.js"
import parseMimetype from "../../fabric/type/file/parseMimetype.js"
import getExtname from "../../core/path/core/getExtname.js"
import getBasename from "../../core/path/core/getBasename.js"
import groupBy from "../../fabric/type/array/groupBy.js"
import arrify from "../../fabric/type/any/arrify.js"

class MimetypesManager extends ConfigFile {
  async populate() {
    return import("../../fabric/constants/FILE_TYPES.js") //
      .then(({ mimetypes }) => mimetypes)
  }

  async postload() {
    this.mimetypes = this.value
    this.extnames = Object.create(null)
    this.basenames = Object.create(null)
    for (const type in this.mimetypes) {
      if (Object.hasOwn(this.mimetypes, type)) {
        for (const subtype in this.mimetypes[type]) {
          if (Object.hasOwn(this.mimetypes[type], subtype)) {
            const target = this.mimetypes[type][subtype]
            target.extnames?.forEach((item) => (this.extnames[item] = target))
            target.basenames?.forEach((item) => (this.basenames[item] = target))
          }
        }
      }
    }
  }

  #normalize(mimetype, exts, options) {
    const { type, subtype } = parseMimetype(mimetype)

    if (type in this.mimetypes) {
      const out = {}
      exts = arrify(exts)

      if (subtype === "*") {
        if (options?.keepGlob) {
          out[`${type}/*`] = [...exts]
        } else {
          for (const key in this.mimetypes[type]) {
            if (key === "*") continue
            if (Object.hasOwn(this.mimetypes[type], key)) {
              out[`${type}/${key}`] = [
                ...exts,
                ...this.mimetypes[type][key].extnames,
              ]
            }
          }
        }
      } else if (subtype in this.mimetypes[type]) {
        out[`${type}/${subtype}`] = [
          ...exts,
          ...this.mimetypes[type][subtype].extnames,
        ]
      } else {
        out[`${type}/${subtype}`] = [...exts]
      }

      return out
    }

    throw new Error(`Unknown mimetype type: ${type}`)
  }

  normalize(mimetypes, options) {
    const out = {}

    if (typeof mimetypes === "string") mimetypes = [mimetypes]

    if (Array.isArray(mimetypes)) {
      for (const item of mimetypes) {
        Object.assign(out, this.#normalize(item, undefined, options))
      }
    } else {
      for (const key in mimetypes) {
        if (Object.hasOwn(mimetypes, key)) {
          Object.assign(out, this.#normalize(key, mimetypes[key], options))
        }
      }
    }

    return out
  }

  async add(mimetypes, appName) {
    mimetypes = this.normalize(mimetypes, { keepGlob: true })

    for (const mimetype in mimetypes) {
      if (Object.hasOwn(mimetypes, mimetype)) {
        const { extnames, basenames } = groupBy(mimetypes[mimetype], (item) =>
          item.startsWith(".") ? "extnames" : "basenames"
        )

        const { type, subtype } = parseMimetype(mimetype)

        this.mimetypes[type] ??= {}
        this.mimetypes[type][subtype] ??= {}
        const target = this.mimetypes[type][subtype]

        if (appName) {
          target.apps ??= []
          if (!target.apps.includes(appName)) target.apps.unshift(appName) // add latest app as default
        }

        if (extnames) {
          target.extnames ??= []
          for (const ext of extnames) {
            if (!target.extnames.includes(ext)) target.extnames.push(ext)
            this.extnames[ext] ??= target
          }
        }

        if (basenames) {
          target.basenames ??= []
          for (const bn of basenames) {
            if (!target.basenames.includes(bn)) target.basenames.push(bn)
            this.basenames[bn] ??= target
          }
        }
      }
    }

    return this.save()
  }

  lookup(path) {
    path = path.toLowerCase()
    return (
      this.extnames[getExtname(path)] ?? this.basenames[getBasename(path)] ?? {}
    )
  }

  getApps(path) {
    const out = this.lookup(path)

    if (out.apps === undefined && out.mimetype) {
      const { type } = parseMimetype(out.mimetype)
      return this.mimetypes[type]?.["*"]?.apps
    }

    return out.apps
  }

  parse(mimetype) {
    return parseMimetype(mimetype)
  }
}

const mimetypesManager = new MimetypesManager(".mimetypes.json")
mimetypesManager.init()

export default mimetypesManager
