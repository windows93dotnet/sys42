import renderAnimation from "../renderers/renderAnimation.js"

export default async function removeElements(elements, plan, stage) {
  const anim = plan?.animate?.to
  const undones = []

  if (anim) {
    for (const el of elements) {
      if (el.nodeType === Node.ELEMENT_NODE) {
        undones.push(
          renderAnimation(stage, el, "to", anim).then(() => el.remove()),
        )
      } else el.remove()
    }
  } else {
    for (const el of elements) {
      el.remove()
    }
  }

  await Promise.all(undones)
}
