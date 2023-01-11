import ui from "../../../../42/ui.js"
import planets from "../../../fixtures/data/planets.js"

const state = {
  planets: [],
}
for (const item of planets) {
  state.planets.push({
    label: item.name,
    description: item.description,
    content: {
      tag: "textarea.size-full",
      bind: "description",
      compact: true,
      autofocus: true,
    },
  })
}

ui({
  tag: "ui-accordion",
  content: "{{planets}}",
  state,
})
