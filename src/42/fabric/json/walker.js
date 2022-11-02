import configure from "../../core/configure.js"
import isObjectOrArray from "../type/any/is/isObjectOrArray.js"
import { encodeJSONPointerURI, encodeJSONPointer } from "./pointer.js"
import JSONLocator from "./JSONLocator.js"
import loadJSON from "../../core/load/loadJSON.js"
import isBackend from "../../core/env/runtime/inBackend.js"
import noop from "../type/function/noop.js"
import LinkedListNode from "../structure/LinkedListNode.js"

const DEFAULTS = {
  tokens: {
    $id: "$id",
    $anchor: "$anchor",
    $ref: "$ref",
    $recursiveRef: "$recursiveRef",
  },
  baseURL: isBackend
    ? "http://localhost/"
    : location.origin + location.pathname,
}

function getJsonFromCache(cache, url) {
  const out = {
    root: undefined,
    value: undefined,
    found: false,
  }

  if (cache.has(url.href)) {
    out.found = true
    out.value = cache.get(url.href).value
    return out
  }

  out.path = url.origin + url.pathname

  if (cache.has(out.path)) {
    out.found = true
    out.root = cache.get(out.path)
    out.value = out.root.value
  }

  return out
}

function gethashIfSet(value, root, url) {
  if (root && url.hash) {
    value = root.get(url.hash)
    if (root.found === false) throw new Error(`Invalid $ref : ${url.href}`)
  }

  return value
}

function checkRecursiveRef(ctx, $recursiveRef) {
  if (ctx.keyword === $recursiveRef) {
    const url = new URL(ctx.value, ctx.baseURL)
    ctx.uri = url.origin + url.pathname + (url.hash ?? "#")
  }
}

function setContextRef(ctx) {
  ctx.refValue = ctx.value
  const url = new URL(ctx.value, ctx.baseURL)
  ctx.uri = url.origin + url.pathname + (url.hash ?? "#")
  ctx.baseURL = url.origin + url.pathname
  ctx.rootObject = true
  return url
}

function addChild(ctx, keyword, value, isArray) {
  const uri = ctx.uri ? `${ctx.uri}/${encodeJSONPointerURI(keyword)}` : ""
  const child = {
    uri,
    value,
    keyword,
    location: `${ctx.location}/${encodeJSONPointer(keyword)}`,
    baseURL: ctx.baseURL,
    parent: ctx,
  }

  ctx.childs.set(isArray ? Number(keyword) : keyword, child)
  return child
}

class Walker {
  constructor(options, callback = noop) {
    if (typeof options === "function") {
      callback = options
      options = undefined
    }

    this.config = configure(DEFAULTS, options)
    this.callback = this.config.callback ?? callback
    this.cache = new Map()

    if (this.config.cache) {
      for (const [key, val] of Object.entries(this.config.cache)) {
        this.addJson(key, val)
      }
    }
  }

  findReferences(base, obj) {
    const { $id, $anchor } = this.config.tokens

    // TODO: check allready visited
    let out = ""
    if ($id in obj && typeof obj[$id] === "string") {
      const url = new URL(obj[$id], base)
      base = url.origin + url.pathname
      this.addJson(base, obj)
      out = base
    }

    if ($anchor in obj && typeof obj[$anchor] === "string") {
      const url = new URL("#" + obj[$anchor], base)
      base = url.origin + url.pathname + url.hash
      this.addJson(base, obj)
    }

    Object.values(obj).forEach((val) => {
      if (isObjectOrArray(val)) this.findReferences(base, val)
    })

    return out
  }

  clean() {
    // might help garbage collection
    delete this.cache
    delete this.callback
    delete this.config
    delete this.visiteds
    delete this.unlinkeds
  }

  initSource(source) {
    this.tree = {
      value: source,
      keyword: "",
      location: "",
      uri: "",
      baseURL: this.config.baseURL,
      rootObject: true,
      parent: undefined,
    }

    this.tree.root = this.tree

    if (isObjectOrArray(source)) {
      this.addJson(this.config.baseURL, source)
    }

    this.visiteds = new WeakMap()
    this.unlinkeds = new Set()
  }

  checkUnlinkeds() {
    this.unlinkeds.forEach((ctx) => {
      if (this.visiteds.has(ctx.value)) {
        const link = this.visiteds.get(ctx.value)
        if (ctx !== link) {
          ctx.link = link
          this.callback(ctx)
        }
      }
    })
  }

  addCtxLink(ctx) {
    if (this.visiteds.has(ctx.value)) {
      ctx.link = this.visiteds.get(ctx.value)
    } else {
      this.unlinkeds.add(ctx)
    }
  }

  addJson(url, source) {
    this.cache.set(url, new JSONLocator(source))
  }

  getJson(url) {
    const { value, root } = getJsonFromCache(this.cache, url)
    return gethashIfSet(value, root, url)
  }

  async getJsonAsync(url) {
    let { value, root, path, found } = getJsonFromCache(this.cache, url)
    const { strict } = this.config

    if (!found) {
      if (url.href.endsWith(".js")) {
        if (strict === false) {
          value = await import(url).then((m) => m.default)
        } else throw new Error("js module are not allowed in strict mode")
      } else value = await loadJSON(url)

      root = new JSONLocator(value)
      this.cache.set(path, root)
    }

    return gethashIfSet(value, root, url)
  }

  initContextChilds(ctx) {
    this.visiteds.set(ctx.value, ctx)
    ctx.childs ??= new Map()
    const base = this.findReferences(ctx.baseURL, ctx.value)
    if (base) {
      ctx.baseURL = base
      ctx.rootObject = true
    }

    return Array.isArray(ctx.value)
  }

  walk(ctx, parents) {
    const { $ref, $recursiveRef } = this.config.tokens

    if (typeof ctx.value === "string") {
      checkRecursiveRef(ctx, $recursiveRef)
      if (ctx.keyword === $ref) {
        const url = setContextRef(ctx)
        ctx.value = this.getJson(url)
        this.addCtxLink(ctx)
      }
    }

    if (isObjectOrArray(ctx.value) && parents.hasNext(ctx.value) === false) {
      parents = new LinkedListNode(ctx.value, parents)
      const isArray = this.initContextChilds(ctx, parents)
      Object.entries(ctx.value).map(([keyword, value]) =>
        this.walk(addChild(ctx, keyword, value, isArray), parents)
      )
    }

    this.callback(ctx)
  }

  async walkAsync(ctx) {
    const { $ref, $recursiveRef } = this.config.tokens

    if (typeof ctx.value === "string") {
      checkRecursiveRef(ctx, $recursiveRef)
      if (ctx.keyword === $ref) {
        const url = setContextRef(ctx)
        ctx.value = await this.getJsonAsync(url)
        this.addCtxLink(ctx)
      }
    }

    if (isObjectOrArray(ctx.value) && this.visiteds.has(ctx.value) === false) {
      const isArray = this.initContextChilds(ctx)
      await Promise.all(
        Object.entries(ctx.value).map(([keyword, value]) =>
          this.walkAsync(addChild(ctx, keyword, value, isArray))
        )
      )
    }

    this.callback(ctx)
  }

  init(source) {
    this.initSource(source)
    this.walk(this.tree, new LinkedListNode())
    this.checkUnlinkeds()
  }

  async initAsync(source) {
    this.initSource(source)
    await this.walkAsync(this.tree)
    this.checkUnlinkeds()
  }
}

export function walkerSync(source, options, callback) {
  const instance = new Walker(options, callback)
  instance.init(source)
  return instance
}

export default async function walker(source, options, callback) {
  const instance = new Walker(options, callback)
  await instance.initAsync(source)
  return instance
}

walker.sync = walkerSync
