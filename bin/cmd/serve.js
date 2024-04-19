import { pathToFileURL } from "node:url"
import system from "../../src/42/system.js"
import fastify from "fastify"
import disableCache from "fastify-disablecache"
import chromiumBugWarning from "../utils/chromiumBugWarning.js"

import StaticFile from "../utils/StaticFile.js"
import makeDevScript from "./serve/makeDevScript.js"
const task = system.config.tasks.serve

const srcPath = pathToFileURL(system.config.paths.dirs.src).href
const libPath = pathToFileURL(system.config.paths.dirs.lib).href

const errorPage = (ua, status, stack) =>
  makeDevScript(ua) +
  `<pre style="margin:2rem 1rem;white-space:pre-wrap;font-size:90%;word-break:break-word"><h1>${status}</h1><div>${stack}</div><pre>`

function sendEvent(reply, event, data = false) {
  reply.raw.write(`\
event: ${event}
data: ${typeof data === "object" ? JSON.stringify(data) : data}

`)
}

const clients = new Set()

const needDevScript =
  system.config.run.includes("test") || system.config.run.includes("watch")

system
  .on("watch:change", (url) => {
    for (const s of clients) sendEvent(s, "change", url)
  })
  .on("watch:reload", () => {
    for (const s of clients) sendEvent(s, "reload")
  })

async function sendFile(req, reply, base = srcPath, originalError) {
  const asset = new StaticFile(base + req.url)

  try {
    await asset.open()

    if (
      needDevScript &&
      req.headers["sec-fetch-dest"] === "document" &&
      asset.ext === ".html"
    ) {
      const ua = req.headers["user-agent"]
      chromiumBugWarning(ua)

      if (needDevScript) {
        const devStream = makeDevScript(ua)
        asset.headers["Content-Length"] += Buffer.byteLength(devStream, "utf-8")
        reply.headers(asset.headers)
        const content = await asset.read()
        asset.close()

        let i = content.indexOf("</title>")
        if (i > -1) {
          return reply.send(
            content.slice(0, i + 8) + devStream + content.slice(i + 8),
          )
        }

        i = content.indexOf("<!doctype html>")
        if (i > -1) {
          return reply.send(
            content.slice(0, i + 15) + devStream + content.slice(i + 15),
          )
        }

        return reply.send(devStream + content)
      }
    }

    reply.headers(asset.headers)

    if (req.method === "GET") return reply.send(asset.stream())
    asset.close()
  } catch (err) {
    asset?.close?.()

    const error = originalError ?? err
    const is404 = error.code === "ENOENT"

    // try serving sys42 source files as fallback
    if (is404 && originalError === undefined && req.url.startsWith("/42/")) {
      return sendFile(req, reply, libPath, err)
    }

    const status = is404 ? 404 : 500
    reply.code(status)

    return asset.mimetype === "text/html" ||
      asset.mimetype === "application/octet-stream"
      ? reply
          .type("text/html")
          .send(errorPage(req.headers["user-agent"], status, error.stack))
      : reply.type(asset.mimetype).send()
  }
}

async function startServer(port) {
  const host = task.host.replace(/https?:\/\//, "")

  const server = fastify({
    // http2: true,
    // https: task.ssl,
    // logger: {
    //   transport: {
    //     target: "pino-pretty",
    //     options: {
    //       translateTime: "HH:MM:ss",
    //       ignore: "pid,hostname",
    //     },
    //   },
    // },
  })

  server.register(disableCache)

  server.get("/42-dev", (req, reply) => {
    if (req.headers.accept !== "text/event-stream") return

    if (req.headers.host === host) {
      reply.raw.setHeader("Access-Control-Allow-Origin", "null")
    }

    reply.raw.setHeader("Content-Type", "text/event-stream")
    reply.raw.setHeader("Connection", "keep-alive")
    reply.raw.setHeader("Cache-Control", "no-cache,no-transform")
    reply.raw.setHeader("X-No-Compression", true)

    clients.add(reply)

    req.raw.on("error", ({ code }) => {
      if (code === "ECONNRESET") {
        task.log.level(3)(` client closed (${req.id})`)
        clients.delete(reply)
      }
    })

    // make sure firefox trigger the EventSource's "open" event
    sendEvent(reply, "ping")
  })

  server.route({
    url: "*",
    method: ["OPTIONS", "HEAD", "GET"],
    async handler(req, reply) {
      if ("clear-site-data" in req.query) {
        task.log(`🧽 clear site data`)
        reply.header("Clear-Site-Data", '"cache", "storage"')
        if ("empty" in req.query) return reply.send("")
      }

      if (req.headers.host === host) {
        reply.header("Access-Control-Allow-Origin", "null")
      }

      reply.header("Accept-Ranges", "bytes")

      await sendFile(req, reply)
    },
  })

  server.listen({ port }, async () => {
    if (port === task.port) task.log(` serve {white ${task.host}}`)
  })
}

export default async function serve() {
  startServer(task.port)
  // TODO: make a CLI option for vhost proxy
  startServer(3000) // vhost proxy
}
