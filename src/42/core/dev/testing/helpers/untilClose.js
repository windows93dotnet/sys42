import listen from "../../../../fabric/event/listen.js"

export async function untilClose(el) {
  return new Promise((resolve) => {
    const forget = listen(top, {
      "ui:dialog.close || ui:popup.close"({ target }) {
        if (target === el) {
          forget()
          resolve()
        }
      },
    })
  })
}

export default untilClose
