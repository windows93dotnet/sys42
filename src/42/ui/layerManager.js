import inIframe from "../system/env/runtime/inIframe.js"
import inTop from "../system/env/runtime/inTop.js"
import ipc from "../system/ipc.js"
import uid from "../fabric/uid.js"
import emittable from "../fabric/trait/emittable.js"
import noop from "../fabric/type/function/noop.js"
import Layer from "./class/Layer.js"
import makeNewContext from "./utils/makeNewContext.js"
import populateContext from "./utils/populateContext.js"
import { focusFirst, TabOrder } from "../fabric/dom/focus.js"

export const layers = {}

async function initLayer(layerName, options) {
  if (layerName in layers) return
  if (options?.module) {
    const LayerModule = await import(`./layers/${options.module}.js`) //
      .then((m) => m.default)
    layers[layerName] ??= new LayerModule(layerName, options)
  } else {
    layers[layerName] ??= new Layer(layerName, options)
  }
}

function restoreFocus(opener, options) {
  if (!opener || options?.focusOpener === false) return
  requestAnimationFrame(() => {
    document
      .querySelector(`#${opener}`)
      ?.focus({ preventScroll: options?.preventScroll ?? true })

    if (options?.focusOut) {
      const menu = document.activeElement.closest("ui-menu,ui-menubar")
      if (menu) {
        const tab = new TabOrder()
        focusFirst(menu)
        tab[options.focusOut]()
        tab.destroy()
      }
    }
  })
}

if (inTop) {
  ipc
    .on("layer<-init", async ({ layerName, options }, { send }) => {
      await initLayer(layerName, options)
      layers[layerName]
        .on("delete", ({ id, opener }, options) => {
          restoreFocus(opener, options)
          const { instances } = layers[layerName]
          if (instances.has(id)) {
            instances.get(id).off()
            instances.delete(id)
          }
        })
        .on("*", (...args) => send("layer->event", args))
      layers[layerName].instances = new Map()
    })

    .on("layer<-data", ({ layerName, id, data }) => {
      if (layers[layerName].instances.has(id)) {
        const instance = layers[layerName].instances.get(id)
        instance.pause = true

        for (const [key, val] of data.entries()) {
          instance.ctx.global.state.set(key, val)
        }

        instance.pause = false
      }
    })

    .on("layer<-method", async ({ layerName, id, method, args }, meta) => {
      if (method === "add") {
        const [def, options] = args
        const { iframe, send } = meta
        if (
          iframe &&
          "positionable" in def &&
          "x" in def.positionable.of &&
          "y" in def.positionable.of
        ) {
          const rect = iframe.getBoundingClientRect()
          def.positionable.of.x += rect.x
          def.positionable.of.y += rect.y
          if (options?.cursor) {
            options.cursor.x += rect.x
            options.cursor.y += rect.y
          }
        }

        let ctx = makeNewContext()

        def.scope = ""

        // patch actions to send
        ctx.global.actions.get = (path) => {
          if (path === "") return ctx.global.actions
          return (...args) => send("layer->action", id, path, args)
        }

        const res = await layers[layerName].add(def, ctx, options)
        if (res === undefined) return
        ctx = res.ctx

        const instance = { ctx, pause: false }

        const off = ctx.global.state.on("update", { off: true }, (queue) => {
          // TODO: fix endless update in menu checkbox
          // console.log(999, instance.pause)
          if (instance.pause) return

          const data = new Map()
          for (const path of queue) data.set(path, ctx.global.store.get(path))

          send("layer->data", { id, data })
        })

        instance.off = () => {
          off()
          // ctx.cancel()
        }

        layers[layerName].instances.set(id, instance)

        return { id }
      }

      return layers[layerName][method](...args)
    })
}

export default async function layerManager(layerName, options) {
  if (layerName in layers) return layers[layerName]

  if (inIframe) {
    const bus = ipc.to(globalThis.top)

    const instances = new Map()
    const proxyEmitter = emittable()

    window.addEventListener("pagehide", () => {
      for (const id of instances.keys()) {
        const message = { layerName, method: "delete", args: [id] }
        bus.emit("layer<-method", message)
      }
    })

    bus
      .on("layer->action", (id, path, args) => {
        if (instances.has(id)) {
          instances.get(id).ctx.global.actions.get(path)(...args)
        }
      })
      .on("layer->event", (args) => {
        proxyEmitter.emit(...args)
      })
      .on("layer->data", ({ id, data }) => {
        if (instances.has(id)) {
          const instance = instances.get(id)
          instance.pause = true

          for (const [key, val] of data.entries()) {
            instance.ctx.global.state.set(key, val)
          }

          instance.pause = false
        }
      })

    await bus.send("layer<-init", { layerName, options })

    const handler = {
      get(target, method) {
        if (method === Symbol.toStringTag) return "[object Proxy]"
        if (method === "then") return

        if (method === "add") {
          return async function (def, ctx, options = {}) {
            def = { ...def }
            def.id ??= uid()

            populateContext(ctx, def)
            delete def.actions

            const { id } = def
            const { scope } = ctx

            const opener = Layer.getOpener(options.opener)
            options.opener = opener

            const instance = { ctx, scope, opener, pause: false }

            let off
            if (ctx.global) {
              off = ctx.global.state.on("update", { off: true }, (queue) => {
                if (instance.pause) return
                const data = new Map()
                for (const path of queue) {
                  const pathMinusScope = scope
                    ? path.slice(scope.length + 1)
                    : path
                  data.set(pathMinusScope, ctx.global.store.get(path))
                }

                bus.send("layer<-data", { layerName, id, data })
              })

              if (ctx.global.store.value) def.data = ctx.global.store.get(scope)
            } else off = noop

            instance.off = () => {
              off()
              // ctx.cancel()
            }

            instances.set(id, instance)

            const res = await bus.send("layer<-method", {
              layerName,
              id,
              method: "add",
              args: [def, options],
            })

            return res
          }
        }

        if (method in proxyEmitter) {
          return proxyEmitter[method].bind(proxyEmitter)
        }

        return async function (...args) {
          const message = { layerName, method, args }
          const res = await bus.send("layer<-method", message)

          if (method === "delete") {
            const id = args[0]
            if (instances.has(id)) {
              instances.get(id).off()
              instances.delete(id)
            }
          }

          if (method === "clear") {
            for (const { off } of instances.values()) off()
            instances.clear()
          }

          return res
        }
      },
    }

    layers[layerName] ??= new Proxy({}, handler)
  } else {
    await initLayer(layerName, options)
  }

  layers[layerName].on("delete", ({ opener }, options) => {
    restoreFocus(opener, options)
  })

  return layers[layerName]
}

layerManager.layers = layers
