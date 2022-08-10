import test from "../../../../42/test.js"

test.suite.timeout(3000)
// test.suite.serial()

test("transfer state data cross-realms", async (t) => {
  const e2e = await import(
    "../../../../demos/ui/plugins/ipc.plugin.e2e.js"
  ).then((m) => m.default)

  t.utils.listen({
    uidialogopen(e, target) {
      target.style.opacity = 0.01
      t.utils.collect(target)
    },
  })

  await e2e(t)
})
