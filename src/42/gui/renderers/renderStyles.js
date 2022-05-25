import { setStyle } from "../../fabric/dom/setStyles.js"
import register from "../register.js"

export default function renderStyles(el, ctx, styles) {
  const type = typeof styles
  if (type === "string") {
    el.style.cssText = styles
  } else if (type === "function") {
    register(styles.keys, ctx, async () => {
      el.style.cssText = await styles(ctx.state.proxy)
    })
  } else {
    for (const [key, val] of styles) {
      if (typeof val === "function") {
        register(val.keys, ctx, async () =>
          setStyle(el, key, await val(ctx.state.proxy))
        )
      } else {
        setStyle(el, key, val)
      }
    }
  }
}
