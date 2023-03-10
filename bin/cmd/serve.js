import { pathToFileURL } from "node:url"
import system from "../../src/42/system.js"
import fastify from "fastify"
import disableCache from "fastify-disablecache"

import StaticFile from "../utils/StaticFile.js"
import makeDevScript from "./serve/makeDevScript.js"
const task = system.config.tasks.serve

const srcPath = pathToFileURL(system.config.paths.dirs.src).href

const errorPage = (asset, status, stack) =>
  makeDevScript(asset) +
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
      reply.raw.setHeader("access-control-allow-origin", "null")
    }

    reply.raw.setHeader("content-type", "text/event-stream")
    reply.raw.setHeader("connection", "keep-alive")
    reply.raw.setHeader("cache-control", "no-cache,no-transform")
    reply.raw.setHeader("x-no-compression", 1)

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
      const { url } = req

      if ("clear-site-data" in req.query) {
        task.log(`???? clear site data`)
        reply.header("Clear-Site-Data", '"cache", "storage"')
        if ("empty" in req.query) return reply.send("")
      }

      const asset = new StaticFile(srcPath + url)

      if (req.headers.host === host) {
        reply.header("access-control-allow-origin", "null")
      }

      reply.header("accept-ranges", "bytes")

      try {
        await asset.open()

        if (
          needDevScript &&
          req.headers["sec-fetch-dest"] === "document" &&
          asset.ext === ".html"
          // (req.headers["sec-fetch-dest"] === "document" ||
          //   req.headers["sec-fetch-dest"] === "empty") &&
          // (asset.ext === ".html" || asset.ext === ".svg")
        ) {
          const devStream = makeDevScript(asset, reply.getHeader("user-agent"))
          asset.headers["content-length"] += Buffer.byteLength(
            devStream,
            "utf-8"
          )
          reply.headers(asset.headers)
          const content = await asset.read()
          asset.close()

          let i = content.indexOf("</title>")
          if (i > -1) {
            return reply.send(
              content.slice(0, i + 8) + devStream + content.slice(i + 8)
            )
          }

          i = content.indexOf("<!DOCTYPE html>")
          if (i > -1) {
            return reply.send(
              content.slice(0, i + 15) + devStream + content.slice(i + 15)
            )
          }

          return reply.send(devStream + content)
        }

        reply.headers(asset.headers)

        if (req.method === "GET") return reply.send(asset.stream())
        asset.close()
      } catch (err) {
        asset?.close?.()
        const status = err.code === "ENOENT" ? 404 : 500
        reply.code(status)
        return asset.mimetype === "text/html" ||
          asset.mimetype === "application/octet-stream"
          ? reply.type("text/html").send(errorPage(asset, status, err.stack))
          : reply.type(asset.mimetype).send()
      }
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
