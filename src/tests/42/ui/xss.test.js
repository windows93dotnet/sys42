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

const { task } = test

const importmapSupport =
  HTMLScriptElement.supports && HTMLScriptElement.supports("importmap")

test.tasks(
  [
    // task({
    //   title: "XSS example",
    //   description: "XSS Work because hardcoded localStorage.SECRET",
    //   plan: {
    //     tag: "ui-sandbox",
    //     permissions: "app",
    //     script: `ipc.emit('xss', "hello secret")`,
    //   },
    // }),

    // task({
    //   title: "Protected example",
    //   description: "XSS Fail because code know it hasn't found localStorage.SECRET",
    //   plan: {
    //     tag: "ui-sandbox",
    //     permissions: "app",
    //     script: `ipc.emit('xss', new Error("Secret not found"))`,
    //   },
    // }),

    // task({
    //   title: "Timeout example",
    //   description: "XSS Fail because nothing happen until timeout",
    //   timeout: 100,
    //   plan: {
    //     tag: "ui-sandbox",
    //     permissions: "app",
    //     script: `void 0`,
    //   },
    // }),

    task({
      title: "stage.trusted attack",
      description:
        "XSS Fail because stage.trusted is not transferred to top realm",
      plan: [
        {
          // dummy dialog to force top ipc response
          tag: "ui-dialog",
          label: "dummy dialog",
        },
        {
          tag: "ui-sandbox",
          permissions: "app",
          script: `
import dialog from "../../42/ui/components/dialog.js"
dialog(
  {
    label: "malware",
    content: {
      tag: "ui-sandbox",
      permissions: "trusted",
      script: "ipc.emit('xss', localStorage.getItem('SECRET'))"
    }
  },
  { trusted: true }
)
`,
        },
      ],
    }),

    task({
      skip: !importmapSupport,
      working: true,
      trusted: true,
      title: "importmap attack on iframe",
      description: "XSS Work because iframe is not sandboxed",
      plan: [
        {
          tag: "ui-dialog",
          label: "dummy dialog",
        },
        {
          tag: "iframe",
          src: "/tests/fixtures/security/importmap-rpc-attack.html",
        },
      ],
    }),

    task({
      skip: !importmapSupport,
      title: "importmap attack on ui-sandbox",
      description:
        "XSS Fail because top level rpc delete stage.trusted from sandboxed iframes",
      plan: [
        {
          tag: "ui-dialog",
          label: "dummy dialog",
        },
        {
          tag: "ui-sandbox",
          permissions: "app",
          path: "/tests/fixtures/security/importmap-rpc-attack.html",
        },
      ],
    }),
  ],

  (test, { title, plan, timeout: ms, working, trusted, description }) => {
    ms ??= 2000
    test.ui("sandbox", title, async (t, { decay, dest }) => {
      t.timeout(ms + 100)

      const app = decay(ui(dest({ connect: true }), plan, { trusted }))

      let res

      try {
        await app
      } catch (err) {
        res = err
      }

      res ??= await Promise.race([
        when("error").then((e) => {
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

      t.not(res, SECRET, "An untrusted context can access localStorage.SECRET")

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

test.tasks(
  [
    task({
      title: "target.innerHTML",
      plan: {
        on: {
          render: "{{target.innerHTML = '<img/src/onerror=attack()>'}}",
        },
      },
    }),

    task({
      title: "target.outerHTML",
      plan: {
        on: {
          render: "{{target.outerHTML = '<img/src/onerror=attack()>'}}",
        },
      },
    }),

    task({
      title: "entry innerHTML",
      plan: {
        tag: "ui-tabs",
        content: [
          {
            label: "",
            content: [
              {
                tag: "em",
                entry: "foo",
                on: {
                  render: "{{foo.innerHTML = '<img/src/onerror=attack()>'}}",
                },
              },
            ],
          },
        ],
      },
    }),
  ],

  (test, { title, plan, timeout: ms, trusted }) => {
    ms ??= 2000
    test.ui("xss", title, async (t, { decay, dest }) => {
      t.timeout(ms + 100)

      globalThis.attack = function () {
        t.fail("attack was called")
      }

      await decay(ui(dest({ connect: true }), plan, { trusted }))

      await t.sleep(30)

      t.pass()
    })
  }
)
