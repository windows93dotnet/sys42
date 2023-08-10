import Component from "../classes/Component.js"
import { Menu } from "./menu.js"
import extractShortcuts from "../extractShortcuts.js"
import renderOn from "../renderers/renderOn.js"

export class Menubar extends Menu {
  static plan = {
    tag: "ui-menubar",
    role: "menubar",
    on: {
      prevent: true,
      contextmenu: false,
      ArrowLeft: "{{focusPrev()}}",
      ArrowRight: "{{focusNext()}}",
    },
    defaults: {
      focusBack: undefined,
      displayPicto: false,
      shortcuts: {
        openSubmenu: "pointerdown || Enter || Space || ArrowDown",
        closeSubmenu: "pointerdown || ArrowLeft",
      },
    },
  }

  render(plan) {
    if (this.parentElement) {
      renderOn(
        this.parentElement,
        { on: extractShortcuts(plan.items, this.stage) },
        this.stage,
      )
    }

    return super.render(plan)
  }
}

export default Component.define(Menubar)
