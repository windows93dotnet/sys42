import test from "../../../../42/test.js"

test.suite.timeout(3000)
test.suite.serial()

const apps = []
const cleanup = (app) => apps.push(app)
const tmp = test.utils.container({ id: "component-tests" }, () =>
  apps.forEach((app) => app?.destroy?.())
)

test("transfer state data cross-realms", async (t) => {
  const e2e = await import(
    "../../../../demos/ui/plugins/ipc.plugin.e2e.js"
  ).then((m) => m.default)
  test.utils.listen({
    dialogopen(e, target) {
      cleanup(target)
    },
  })
  await e2e(t, { container: tmp(true), cleanup })
})
