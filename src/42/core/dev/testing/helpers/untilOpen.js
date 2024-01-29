import listen from "../../../../fabric/event/listen.js"
import ensureElement from "../../../../fabric/dom/ensureElement.js"

export async function untilOpen(el) {
  el = ensureElement(el)
  return new Promise((resolve) => {
    const forget = listen(top, {
      "ui:dialog.open || ui:popup.open"({ target }) {
        if (target.opener === el.id) {
          forget()
          resolve(target)
        }
      },
    })
  })
}

export default untilOpen
