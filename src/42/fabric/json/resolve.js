/* eslint-disable complexity */
import inBackend from "../../core/env/runtime/inBackend.js"
import configure, { merge } from "../../core/configure.js"
import omit from "../type/object/omit.js"
import isHashmapLike from "../type/any/is/isHashmapLike.js"
import locate from "../locator/locate.js"
import parseJSONPointer from "./parseJSONPointer.js"
import removeItem from "../type/array/removeItem.js"

const { isArray } = Array

const DEFAULTS = {
  keywords: {
    $id: "$id",
    $ref: "$ref",
    $dynamicRef: "$dynamicRef",
    $anchor: "$anchor",
    $dynamicAnchor: "$dynamicAnchor",
    $defs: "$defs",
    $patch: "$patch",
    constants: ["const", "enum"],
  },
  baseURI: inBackend
    ? "http://localhost/"
    : location.origin + location.pathname,
}

const UNLINKED = Symbol("UNLINKED")

function getPath(ref, baseURI) {
  const url = new URL(ref, baseURI)
  const path = url.origin + url.pathname
  const { hash } = url
  return { path, hash }
}

function setBaseURI(obj, carrier) {
  const { $id } = carrier.keywords
  if ($id in obj) {
    const url = new URL(obj[$id], carrier.baseURI)
    carrier.baseURI = url.origin + url.pathname
    if (url.hash) return url.hash
  }
}

function setAnchors(obj, carrier, hash) {
  if (isHashmapLike(obj)) {
    const { $anchor, $dynamicAnchor } = carrier.keywords

    if (hash) {
      carrier.anchors[carrier.baseURI] ??= {}
      carrier.anchors[carrier.baseURI][hash] = obj
    }

    if ($anchor in obj) {
      carrier.anchors[carrier.baseURI] ??= {}
      carrier.anchors[carrier.baseURI]["#" + obj[$anchor]] = obj
    }

    if ($dynamicAnchor in obj) {
      carrier.dynamicAnchors["#" + obj[$dynamicAnchor]] = obj
    }
  }
}

async function fetchUncacheds(carrier, options) {
  await import("../../core/load/loadJSON.js").then(({ default: loadJSON }) =>
    Promise.all(
      carrier.uncacheds.map(async (path) => {
        let value
        if (path.endsWith(".js")) {
          if (options?.strict === false) {
            value = await import(path).then((m) => m.default)
            if (typeof value === "function") {
              value = await value(carrier, options)
            }
          } else throw new Error("js module are not allowed in strict mode")
        } else {
          value = await loadJSON(path)
        }

        await resolve(value, options, {
          ...carrier,
          baseURI: path,
        })
      })
    )
  )
}

export function walk(dest, source, carrier) {
  const { keywords } = carrier
  const { $ref, $dynamicRef, constants } = keywords

  const postfor = []

  for (const [key, val] of Object.entries(source)) {
    if (key === $ref || key === $dynamicRef) continue
    if (isHashmapLike(val) && !constants.includes(key)) {
      const hash = setBaseURI(val, carrier)
      let obj

      const ref =
        $ref in val
          ? val[$ref]
          : $dynamicRef in val
          ? val[$dynamicRef]
          : undefined

      if (ref) {
        const { path, hash } = getPath(ref, carrier.baseURI)
        if (path in carrier.cache === false) carrier.uncacheds.push(path)
        carrier.unlinkeds.unshift({
          current: dest,
          key,
          path,
          hash,
          dynamic: !($ref in val),
        })
        const rest = omit(val, [$ref, $dynamicRef])
        obj = Object.keys(rest).length > 0 ? rest : UNLINKED
      } else obj = { ...val }

      dest[key] = obj

      if (carrier.baseURI in carrier.cache === false) {
        carrier.cache[carrier.baseURI] = obj
        removeItem(carrier.uncacheds, carrier.baseURI)
      }

      setAnchors(obj, carrier, hash)
      postfor.push([val, obj])
    } else if (isArray(val)) {
      const arr = []
      dest[key] = arr
      postfor.push([val, arr])
    } else dest[key] = val
  }

  for (const [val, obj] of postfor) {
    walk(obj, val, carrier)
  }

  return carrier
}

export default async function resolve(source, options, carrier) {
  const isCarrierDefined = Boolean(carrier)

  carrier ??= {
    baseURI: options?.baseURI ?? DEFAULTS.baseURI,
    keywords: { ...DEFAULTS.keywords, ...options?.keywords },
    fetch: options?.fetch ?? true,
    unlinkeds: [],
    uncacheds: [],
    anchors: {},
    dynamicAnchors: {},
    cache: {},
  }

  const { $ref } = carrier.keywords

  const out = {}

  if (isHashmapLike(source)) {
    setBaseURI(source, carrier)
    out.dest = {}
    carrier.cache[carrier.baseURI] = out.dest
    removeItem(carrier.uncacheds, carrier.baseURI)
    if ($ref in source) {
      const { path, hash } = getPath(source[$ref], carrier.baseURI)
      if (path in carrier.cache === false) carrier.uncacheds.push(path)
      carrier.unlinkeds.unshift({ current: out, key: "dest", path, hash })
    }
  } else if (isArray(source)) {
    out.dest = []
    carrier.cache[carrier.baseURI] = out.dest
    removeItem(carrier.uncacheds, carrier.baseURI)
  } else return source

  if (!isCarrierDefined && options?.cache) {
    const undones = []
    for (const [key, val] of Object.entries(options.cache)) {
      undones.push(
        resolve(val, options, {
          ...carrier,
          fetch: false,
          baseURI: key,
        })
      )
    }

    await Promise.all(undones)
  }

  walk(out.dest, source, carrier)

  if (carrier.fetch && carrier.uncacheds.length > 0) {
    await fetchUncacheds(carrier, options)
  }

  const mustResolve = new Set()

  for (const item of carrier.unlinkeds) {
    const { current, key, path, hash, dynamic } = item

    let res

    if (path in carrier.anchors && hash in carrier.anchors[path]) {
      res = carrier.anchors[path][hash]
    } else if (dynamic && hash in carrier.dynamicAnchors) {
      res = carrier.dynamicAnchors[hash]
    } else {
      const obj = carrier.cache[path]
      res = locate.run(obj, parseJSONPointer(hash))
    }

    if (res === UNLINKED) {
      if (mustResolve.has(path + hash)) {
        throw new Error(`Unresolved JSON Pointer: ${path + hash}`)
      }

      mustResolve.add(path + hash)
      carrier.unlinkeds.push(item)
      continue
    }

    let prev = current[key]

    if (prev === UNLINKED) prev = undefined

    let next

    if (prev && isArray(res)) {
      prev = isArray(prev) ? prev : Object.assign([], prev)
      next = merge(prev, res)
    } else if (isHashmapLike(res)) {
      next = prev && isHashmapLike(prev) ? configure(prev, res) : res
    } else {
      next = prev ?? res
    }

    current[key] = next
  }

  return out.dest
}

export { resolve }
