import persist from "../../system/persist.js"

export default async (ctx) => {
  const persistPath = `$HOME/ui/${ctx.digest}`

  if (persist.has(persistPath)) {
    const res = await persist.load(persistPath)
    Object.assign(ctx.reactive.state, res)
  }

  ctx.reactive.on("update", () => {
    persist(persistPath, ctx.reactive.data)
  })
}
