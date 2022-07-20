/* eslint-disable camelcase */
import inIframe from "../../system/env/runtime/inIframe.js"
import inTop from "../../system/env/runtime/inTop.js"
import ipc from "../../system/ipc.js"
import allocate from "../../fabric/locator/allocate.js"
import configure from "../../fabric/configure.js"

const debug = false

const DEFAULTS = {
  parent_iframe_to_top: true,
  top_to_parent_iframe: true,
  parent_top_to_iframe: true,
  iframe_to_parent_top: true,
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

if (inTop) {
  ipc.on("42-ui-ipc-handshake", (data, meta) => iframes.push(meta.send))
}

if (inIframe) {
  ipc.to.top.send("42-ui-ipc-handshake")
}

export default async (ctx, options) => {
  if (ctx.plugins.ipc) return
  ctx.plugins.ipc = true

  const {
    parent_iframe_to_top, //
    top_to_parent_iframe,
    parent_top_to_iframe,
    iframe_to_parent_top,
  } = configure(DEFAULTS, options)

  // Parent Iframe --> Top

  if (parent_iframe_to_top) {
    if (inTop && ctx.parentId) {
      ipc.on(`42-ui-ipc-${ctx.parentId}`, (data) => {
        ctx.reactive.assign("/", data)
      })
    }

    if (inIframe) {
      ctx.reactive.on("update", (queue) => {
        if (debug) console.log("Parent Iframe --> Top", queue)
        ipc.to.top.send(`42-ui-ipc-${ctx.id}`, getData(queue, ctx))
      })
    }
  }

  // Top --> Parent Iframe

  if (top_to_parent_iframe) {
    if (inTop && ctx.parentId) {
      ctx.reactive.on("update", (queue) => {
        if (debug) console.log("Top --> Parent Iframe", queue)
        const data = getData(queue, ctx)
        for (const send of iframes) send(`42-ui-ipc-${ctx.parentId}`, data)
      })
    }

    if (inIframe) {
      ipc.to.top.on(`42-ui-ipc-${ctx.id}`, (data) => {
        ctx.reactive.assign("/", data)
      })
    }
  }

  // Parent Top --> Iframe

  if (parent_top_to_iframe) {
    if (inTop) {
      ctx.reactive.on("update", (queue) => {
        if (debug) console.log("Parent Top --> Iframe", queue)
        const data = getData(queue, ctx)
        for (const send of iframes) send(`42-ui-ipc-${ctx.id}`, data)
      })
    }

    if (inIframe) {
      ipc.to.top.on(`42-ui-ipc-${ctx.parentId}`, (data) => {
        ctx.reactive.assign("/", data)
      })
    }
  }

  // Iframe --> Parent Top

  if (iframe_to_parent_top) {
    if (inTop) {
      ipc.on(`42-ui-ipc-${ctx.id}`, (data) => {
        ctx.reactive.assign("/", data)
      })
    }

    if (inIframe) {
      ctx.reactive.on("update", (queue) => {
        if (debug) console.log("Iframe --> Parent Top", queue)
        ipc.to.top.send(`42-ui-ipc-${ctx.parentId}`, getData(queue, ctx))
      })
    }
  }
}
