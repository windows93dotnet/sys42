import Component from "../classes/Component.js"
import { Menu } from "./menu.js"
import extractShortcuts from "../extractShortcuts.js"
import renderOn from "../renderers/renderOn.js"

export class Menubar extends Menu {
  static plan = {
    tag: "ui-menubar",
    role: "menubar",

    on: [
      {
        "prevent": true,
        "contextmenu": false,
        "ArrowUp || ArrowLeft || PageUp": "{{focusPrev()}}",
        "ArrowDown || ArrowRight || PageDown": "{{focusNext()}}",
        "Home": "{{focusFirst()}}",
        "End": "{{focusLast()}}",
        "pointerleave || focusout": "{{resetLastHovered(e)}}",
      },
      {
        selector: ":scope > li",
        pointermove: "{{triggerMenuitem(e, target)}}",
      },
    ],

    defaults: {
      focusBack: undefined,
      displayPicto: false,
      shortcuts: {
        openSubmenu: "uitriggersubmenu || Enter || Space || ArrowDown",
        closeSubmenu: "uitriggersubmenu || pointerdown || ArrowLeft",
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
