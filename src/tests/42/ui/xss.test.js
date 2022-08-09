import test from "../../../42/test.js"

import ui from "../../../42/ui.js"
import ipc from "../../../42/core/ipc.js"
import when from "../../../42/fabric/type/promise/when.js"
import timeout from "../../../42/fabric/type/promise/timeout.js"
import normalizeError from "../../../42/fabric/type/error/normalizeError.js"

const debug = 1

const SECRET = "hello secret"
let secretBackup

test.setup(() => {
  secretBackup = localStorage.getItem("SECRET")
  localStorage.setItem("SECRET", SECRET)
})

test.teardown(() => {
  if (secretBackup) localStorage.setItem("SECRET", secretBackup)
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
    //   title: "XSS example",
    //   description: "XSS Work because hardcoded localStorage.SECRET",
    //   def: {
    //     tag: "ui-sandbox",
    //     permissions: "app",
    //     script: `ipc.to.parent.emit('xss', "hello secret")`,
    //   },
    // }),

    // task({
    //   title: "Protected example",
    //   description: "XSS Fail because code know it hasn't found localStorage.SECRET",
    //   def: {
    //     tag: "ui-sandbox",
    //     permissions: "app",
    //     script: `ipc.to.parent.emit('xss', new Error("Secret not found"))`,
    //   },
    // }),

    // task({
    //   title: "Timeout example",
    //   description: "XSS Fail because nothing happen until timeout",
    //   timeout: 100,
    //   def: {
    //     tag: "ui-sandbox",
    //     permissions: "app",
    //     script: `void 0`,
    //   },
    // }),

    task({
      title: "ctx.trusted attack",
      description:
        "XSS Fail because ctx.trusted is not transfered to top realm",
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
      working: true,
      trusted: true,
      title: "importmap attack on iframe",
      description: "XSS Work because iframe is not sandboxed",
      def: [
        {
          // dummy dialog to force top ipc response
          tag: "ui-dialog",
          label: "dummy dialog",
        },
        {
          tag: "iframe",
          src: "/tests/fixtures/security/importmap-xrealm-attack.html",
        },
      ],
    }),

    task({
      title: "importmap attack on ui-sandbox",
      description:
        "XSS Fail because top level xrealm delete ctx.trusted from sandboxed iframes",
      def: [
        {
          // dummy dialog to force top ipc response
          tag: "ui-dialog",
          label: "dummy dialog",
        },
        {
          tag: "ui-sandbox",
          permissions: "trusted",
          path: "/tests/fixtures/security/importmap-xrealm-attack.html",
        },
      ],
    }),
  ],

  (test, { title, def, timeout: ms, working, trusted, description }) => {
    ms ??= 2000
    test.serial(title, async (t) => {
      t.timeout(ms + 100)

      const app = ui(tmp(true), def, { trusted })
      cleanup(app)

      let res

      try {
        await app
      } catch (err) {
        res = err
      }

      res ??= await Promise.race([
        when(document.body, "error").then((e) => {
          e.preventDefault()
          return normalizeError(e)
        }),
        ipc.once("xss"),
        timeout(ms).catch((err) => err),
      ])

      if (working) {
        t.is(res, SECRET, "A task should have found localStorage.SECRET")
        return
      }

      t.not(res, SECRET, "An untrusted context can access top localStorage")

      if (res == null) return

      t.isError(res)

      if (
        description ||
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
