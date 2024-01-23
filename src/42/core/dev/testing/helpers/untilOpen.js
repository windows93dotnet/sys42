import listen from "../../../../fabric/event/listen.js"

export async function untilOpen(opener) {
  return new Promise((resolve) => {
    const forget = listen(top, {
      "ui:dialog.open || ui:popup.open"({ target }) {
        if (target.opener === opener.id) {
          forget()
          resolve(target)
        }
      },
    })
  })
}

export default untilOpen
