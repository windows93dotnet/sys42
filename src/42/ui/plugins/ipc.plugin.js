import inIframe from "../../system/env/runtime/inIframe.js"
import inTop from "../../system/env/runtime/inTop.js"
import ipc from "../../system/ipc.js"
import allocate from "../../fabric/locator/allocate.js"
import configure from "../../fabric/configure.js"

const DEFAULTS = {
  parentIframeToTop: true,
  topToParentIframe: true,
  parentTopToIframe: !true,
}

function getData(queue, ctx) {
  const data = {}
  for (const key of queue) {
    if (key.startsWith("/ui-")) continue
    allocate(data, key, ctx.reactive.get(key, { silent: true }), "/")
  }

  return data
}

const iframes = []

let topBus

if (inTop) {
  ipc.on("42-ui-ipc-handshake", (data, meta) => iframes.push(meta.send))
}

if (inIframe) {
  topBus ??= ipc.to(globalThis.top)
  topBus.send("42-ui-ipc-handshake")
}

export default async (ctx, options) => {
  const {
    parentIframeToTop, //
    topToParentIframe,
    parentTopToIframe,
  } = configure(DEFAULTS, options)

  // Parent Iframe --> Top

  if (parentIframeToTop) {
    if (inTop && ctx.parentId) {
      ipc.on(`42-ui-ipc-${ctx.parentId}`, (data) => {
        ctx.reactive.assign("/", data)
      })
    }

    if (inIframe) {
      ctx.reactive.on("update", (queue) => {
        console.log("Parent Iframe --> Top", queue)
        topBus.send(`42-ui-ipc-${ctx.id}`, getData(queue, ctx))
      })
    }
  }

  // Top --> Parent Iframe

  if (topToParentIframe) {
    if (inTop && ctx.parentId) {
      ctx.reactive.on("update", (queue) => {
        console.log("Top --> Parent Iframe", queue)
        const data = getData(queue, ctx)
        for (const send of iframes) send(`42-ui-ipc-${ctx.parentId}`, data)
      })
    }

    if (inIframe) {
      topBus.on(`42-ui-ipc-${ctx.id}`, (data) => {
        ctx.reactive.assign("/", data)
      })
    }
  }

  // Parent Top --> Iframe

  if (parentTopToIframe) {
    if (inTop) {
      ctx.reactive.on("update", (queue) => {
        const data = getData(queue, ctx)
        for (const send of iframes) send(`42-ui-ipc-${ctx.id}`, data)
      })
    }

    if (inIframe) {
      topBus.on(`42-ui-ipc-${ctx.parentId}`, (data) => {
        ctx.reactive.assign("/", data)
      })
    }
  }
}
