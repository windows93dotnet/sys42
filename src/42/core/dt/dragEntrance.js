import listen from "../../fabric/event/listen.js"
import dataTransfertImport from "./dataTransfertImport.js"

export function dragEntrance(obj) {
  let cnt = 0
  return listen({
    prevent: true,
    signal: obj.signal,

    dragenter(e) {
      e.dataTransfer.dropEffect = "none" // prevent dropEffect flickering
      if (cnt === 0) obj.start?.(e)
      cnt++
    },

    dragleave(e) {
      cnt--
      if (cnt === 0) obj.stop?.(e)
    },

    dragover(e) {
      obj.drag?.(e)
    },

    async drop(e) {
      cnt = 0

      if (obj.drop) {
        const imports = await dataTransfertImport(e)
        imports.x = e.x
        imports.y = e.y
        await obj.drop(imports, e)
      }

      obj.stop?.(e)
    },
  })
}

export default dragEntrance
