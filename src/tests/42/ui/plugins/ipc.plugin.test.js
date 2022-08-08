import test from "../../../../42/test.js"

test.suite.timeout(3000)
test.suite.serial()

const items = []
const destroyable = (app) => {
  items.push(app)
  return app
}

const tmp = test.utils.container({ id: "component-tests" }, () =>
  items.forEach((item) => item?.destroy?.())
)

test("transfer state data cross-realms", async (t) => {
  const e2e = await import(
    "../../../../demos/ui/plugins/ipc.plugin.e2e.js"
  ).then((m) => m.default)
  test.utils.listen({
    uidialogopen(e, target) {
      target.style.opacity = 0.01
      destroyable(target)
    },
  })
  await e2e(t, { container: tmp(true), destroyable })
})
