/* eslint-disable max-depth */
import ConfigFile from "../classes/ConfigFile.js"
import parseMimetype from "../../fabric/type/file/parseMimetype.js"
import getExtname from "../../core/path/core/getExtname.js"
import getBasename from "../../core/path/core/getBasename.js"
import groupBy from "../../fabric/type/array/groupBy.js"

class MimeypesManager extends ConfigFile {
  async init() {
    await super.init()
    this.mimetypes = this.value.mimetypes
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

  async populate() {
    this.value = await import("../../fabric/constants/FILE_TYPES.js") //
      .then((m) => m.default)
  }

  #resolveMimetype(mimetype, exts, options) {
    const { type, subtype } = parseMimetype(mimetype)

    const out = {}

    if (type in this.mimetypes) {
      if (subtype === "*") {
        if (options?.keepGlob) {
          out[`${type}/*`] = [...(exts ?? [])]
        } else {
          for (const key in this.mimetypes[type]) {
            if (Object.hasOwn(this.mimetypes[type], key)) {
              out[`${type}/${key}`] = [
                ...(exts ?? []),
                ...this.mimetypes[type][key].extnames,
              ]
            }
          }
        }
      } else if (subtype in this.mimetypes[type]) {
        out[`${type}/${subtype}`] = [
          ...(exts ?? []),
          ...this.mimetypes[type][subtype].extnames,
        ]
      }
    }

    return out
  }

  add(mimetypes, appName) {
    mimetypes = this.resolve(mimetypes, { keepGlob: true })

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
          target.apps.unshift(appName) // add latest app as default
        }

        if (extnames) {
          for (const ext of extnames) {
            if (!target.extnames.includes(ext)) target.extnames.push(ext)
            this.extnames[ext] ??= target
          }
        }

        if (basenames) {
          for (const bn of basenames) {
            if (!target.basenames.includes(bn)) target.basenames.push(bn)
            this.basenames[bn] ??= target
          }
        }
      }
    }

    return this.save()
  }

  resolve(mimetypes, options) {
    const out = {}

    if (typeof mimetypes === "string") mimetypes = [mimetypes]

    if (Array.isArray(mimetypes)) {
      for (const item of mimetypes) {
        Object.assign(out, this.#resolveMimetype(item, undefined, options))
      }
    } else {
      for (const key in mimetypes) {
        if (Object.hasOwn(mimetypes, key)) {
          Object.assign(
            out,
            this.#resolveMimetype(key, mimetypes[key], options)
          )
        }
      }
    }

    return out
  }

  lookup(path) {
    return (
      this.extnames[getExtname(path).toLowerCase()] ??
      this.basenames[getBasename(path).toLowerCase()] ??
      {}
    )
  }

  getApps(path) {
    const out = this.lookup(path)

    if (out.apps === undefined) {
      const { type } = parseMimetype(out.mimetype)
      return this.mimetypes[type]?.["*"]?.apps
    }

    return out.apps
  }
}

const mimetypesManager = new MimeypesManager("mimetypes.json")
await mimetypesManager.init()

export default mimetypesManager
