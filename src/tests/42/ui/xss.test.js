import test from "../../../42/test.js"

import ui from "../../../42/ui.js"
import ipc from "../../../42/core/ipc.js"
import when from "../../../42/fabric/type/promise/when.js"
import timeout from "../../../42/fabric/type/promise/timeout.js"
import normalizeError from "../../../42/fabric/type/error/normalizeError.js"

const debug = 1

const SECRET = "hello secret"
let backup

test.setup(() => {
  backup = localStorage.getItem("SECRET")
  localStorage.setItem("SECRET", SECRET)
})

test.teardown(() => {
  if (backup) localStorage.setItem("SECRET", backup)
  else localStorage.removeItem("SECRET")
})

test.suite.serial()

const apps = []
const cleanup = (app) => apps.push(app)
const tmp = test.utils.container({ id: "xss-tests" }, () =>
  apps.forEach((app) => app?.destroy())
)

const { task } = test

test.tasks(
  [
    // task({
    //   title: "Failing example",
    //   failing: true,
    //   def: {
    //     tag: "ui-sandbox",
    //     permissions: "app",
    //     script: `ipc.to.parent.emit('xss', "hello secret")`,
    //   },
    // }),

    // task({
    //   title: "Protected example",
    //   def: {
    //     tag: "ui-sandbox",
    //     permissions: "app",
    //     script: `ipc.to.parent.emit('xss', new Error("Secret not found"))`,
    //   },
    // }),

    // task({
    //   title: "Timeout example",
    //   timeout: 100,
    //   def: {
    //     tag: "ui-sandbox",
    //     permissions: "app",
    //     script: `void 0`,
    //   },
    // }),

    task({
      // Fail because ctx.trusted is not transfered to top realm
      title: "ctx.trusted attack",
      def: [
        {
          // dummy dialog to force top ipc response
          tag: "ui-dialog",
          label: "dummy dialog",
        },
        {
          // try to use "app" permission only to get top level secret
          tag: "ui-sandbox",
          permissions: "app",
          script: `
import dialog from "../../42/ui/components/dialog.js"
import xrealm from "../../42/core/ipc/xrealm.js"
dialog(
  {
    label: "malware",
    content: {
      tag: "ui-sandbox",
      permissions: "trusted",
      script: "ipc.to.parent.emit('xss', localStorage.getItem('SECRET'))"
    }
  },
  { trusted: true }
)
`,
        },
      ],
    }),

    task({
      // Fail because xrealm.inTop is not writable
      title: "xrealm.inTop attack",
      def: [
        {
          // dummy dialog to force top ipc response
          tag: "ui-dialog",
          label: "dummy dialog",
        },
        {
          // try to use "app" permission only to get top level secret
          tag: "ui-sandbox",
          permissions: "app",
          script: `
import dialog from "../../42/ui/components/dialog.js"
import xrealm from "../../42/core/ipc/xrealm.js"
// xrealm.inTop = true
Object.defineProperty(xrealm, "inTop", {get: ()=> true})
dialog(
  {
    label: "malware",
    content: {
      tag: "ui-sandbox",
      permissions: "trusted",
      script: "ipc.to.parent.emit('xss', localStorage.getItem('SECRET'))"
    }
  },
  { trusted: true }
)
`,
        },
      ],
    }),

    task({
      title: "importmap attack",
      def: [
        {
          // dummy dialog to force top ipc response
          tag: "ui-dialog",
          label: "dummy dialog",
        },
        {
          tag: "ui-sandbox",
          permissions: "app",
          path: "/tests/fixtures/security/importmap-xrealm-attack.html",
        },
      ],
    }),
  ],

  (test, { title, def, timeout: ms }) => {
    ms ??= 2000
    test.serial(title, async (t) => {
      t.timeout(ms + 100)
      const app = ui(tmp(true), def)
      cleanup(app)

      const res = await Promise.race([
        when(document.body, "error").then((e) => {
          e.preventDefault()
          return normalizeError(e)
        }),
        ipc.once("xss"),
        timeout(ms).catch((err) => err),
      ])

      t.not(res, SECRET, "An untrusted context can access top localStorage")

      if (res == null) return

      t.isError(res)

      if (
        !debug ||
        res.message.startsWith("Timed out") ||
        res.message.startsWith("Secret not found")
      ) {
        return
      }

      t.log(res)
    })
  }
)
