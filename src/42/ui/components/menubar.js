import Component from "../classes/Component.js"
import { Menu } from "./menu.js"
import renderOn from "../renderers/renderOn.js"
import extractShortcuts from "../utils/extractShortcuts.js"

export class Menubar extends Menu {
  static plan = {
    tag: "ui-menubar",
    role: "menubar",

    on: [
      {
        "prevent": true,
        "contextmenu": false,
        "ArrowLeft || PageUp": "{{focusPrev()}}",
        "ArrowRight || PageDown": "{{focusNext()}}",
        "Home": "{{focusFirst()}}",
        "End": "{{focusLast()}}",
        "pointerenter || pointerleave": "{{resetLastHovered(e)}}",
      },
      {
        "selector": ":scope > li",
        "pointermove || pointerdown": "{{triggerMenuitem(target, e)}}",
      },
    ],

    defaults: {
      focusBack: undefined,
      displayPicto: false,
      shortcuts: {
        initialExpand: "pointerdown",
        openSubmenu: "ui:trigger-submenu || Enter || Space || ArrowDown",
        closeSubmenu: "ui:trigger-submenu || pointerdown || ArrowLeft",
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
