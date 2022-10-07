/* eslint-disable no-sequences */
// @related https://gist.github.com/dgraham/92e4c45da3707a3fe789
// @related https://github.com/sindresorhus/ky
// @read https://developer.mozilla.org/en-US/docs/Web/API/AbortController

import settings from "./settings.js"
import noop from "../fabric/type/function/noop.js"

const configure = settings("http", {
  headers: { "X-Requested-With": "XMLHttpRequest" },
  referrerPolicy: "same-origin",
})

export const POST_JSON_CONFIG = {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
}

let HTTP_STATUS_CODES

export class HTTPError extends Error {
  constructor(res, url) {
    const statusText =
      res.ok === false &&
      (res.statusText === "OK" || res.statusText === "") &&
      HTTP_STATUS_CODES
        ? HTTP_STATUS_CODES[res.status] || res.statusText
        : res.statusText

    url = String(url)

    if (res.url && url.endsWith(res.url) === false) url = res.url

    super(`${res.status} ${statusText} : ${url}`)
    Object.defineProperty(this, "name", { value: "HTTPError" })

    this.url = url
    this.status = res.status
    this.statusText = statusText
    this.headers = Object.fromEntries(res.headers)
  }
}

// 1. Inspired by jQuery ajax
// @read https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304

export async function handleStatus(res, url) {
  if (res.ok || res.status === 304 /* 1 */) return res

  // Lazy load status codes list
  HTTP_STATUS_CODES ??= await import("../fabric/constants/HTTP_STATUS_CODES.js") //
    .then((m) => m.default)

  throw new HTTPError(res, url)
}

export async function normalizeBody(body, out, parent) {
  if (body instanceof FormData || body instanceof ReadableStream) return body
  if (!out) out = new FormData()
  for (let [key, val] of Object.entries(body)) {
    if (parent) key = `${parent}[${key}]`

    if (val.nodeName === "FORM") val = new FormData(val)
    else if (val.form) {
      const input = val
      val = new FormData(val.form) // force any data serialization
      for (const inputFormKey of val.keys()) {
        if (input.name !== inputFormKey) val.delete(inputFormKey)
      }
    }

    if (val instanceof FormData) {
      for (const [subkey, val] of val) {
        out.append(`${key}[${subkey}]`, val)
      }

      return
    }

    if (typeof val === "object" && !(val instanceof File)) {
      normalizeBody(val, out, key)
    } else out.append(key, val)
  }

  return out
}

async function request(url, options) {
  try {
    return await fetch(url, options)
  } catch (cause) {
    const infos = { url, reached: false }
    let message = "This url can't be reached"
    try {
      const res = await fetch(url, { ...options, mode: "no-cors" })
      infos.reached = true
      if (res.status !== 0) {
        infos.status = res.status
        infos.statusText = res.statusText
        infos.headers = Object.fromEntries(res.headers)
      }

      message =
        'This url can be reached using "no-cors" but the response is empty'
    } catch {}

    throw Object.assign(new Error(`${message} : ${url}`, { cause }), infos)
  }
}

const makeMethod = (method, withBody = true) =>
  withBody
    ? async (url, body, ...rest) => {
        const config = configure(...rest, { method })
        body = config.body ?? body
        if (body) {
          config.body = config.headers["Content-Type"].startsWith(
            "application/json"
          )
            ? JSON.stringify(body)
            : await normalizeBody(body)
        }

        const res = await request(url, config)
        return handleStatus(res, url)
      }
    : async (url, ...rest) => {
        const config = configure(...rest, { method })
        const res = await request(url, config)
        return handleStatus(res, url)
      }

export const postJSON = async (url, body, ...rest) => {
  const config = configure(...rest, POST_JSON_CONFIG)
  body = config.body ?? body
  config.body = JSON.stringify(body)
  const res = await request(url, config)
  return handleStatus(res, url)
}

export const http = makeMethod("GET", false)
export const httpGet = makeMethod("GET", false)
export const httpHead = makeMethod("HEAD", false)
export const httpPost = makeMethod("POST")
export const httpPut = makeMethod("PUT")
export const httpDelete = makeMethod("DELETE")
export const httpOptions = makeMethod("OPTIONS")
export const httpPatch = makeMethod("PATCH")

Object.assign(http, {
  get: httpGet,
  post: httpPost,
  head: httpHead,
  put: httpPut,
  delete: httpDelete,
  options: httpOptions,
  patch: httpPatch,
  postJSON,
})

http.post.json = postJSON

// @read https://web.dev/fetch-upload-streaming/

export const makeStream = (requestMethod, withBody = true) =>
  withBody
    ? (url, cb = noop, ...rest) => {
        const { readable, writable } = new TransformStream()
        requestMethod(url, readable, ...rest).then(cb)
        return writable
      }
    : (url, { queuingStrategy, onheaders, onsize, signal } = {}, ...rest) => {
        let reader
        const rs = new ReadableStream(
          {
            async pull(controller) {
              if (!reader) {
                const res = await requestMethod(url, { signal }, ...rest)
                onheaders?.(res.headers, rs)
                onsize?.(Number(res.headers.get("content-length")), rs)
                reader = res.body.getReader()
              }

              const { value, done } = await reader.read()
              if (done) controller.close()
              else controller.enqueue(value)
            },
          },
          queuingStrategy
        )

        rs.headers = (fn) => ((onheaders = fn), rs)
        rs.size = (fn) => ((onsize = fn), rs)
        return rs
      }

export const httpStreamGet = makeStream(httpGet, false)
export const httpStreamPost = makeStream(httpPost)

http.stream = { get: httpStreamGet, post: httpStreamPost }
http.source = httpStreamGet

export default http
