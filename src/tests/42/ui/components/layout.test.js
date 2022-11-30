import ui from "../../../../42/ui.js"
import planets from "../../../fixtures/data/planets.js"

const lorem =
  "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quas, quo quidem voluptate, consectetur, sint repellendus expedita consequatur pariatur delectus cum inventore iure aperiam? Ad facere nemo tenetur nesciunt quam autem voluptatibus vel temporibus dolorem atque. Dolores beatae magnam iure, architecto eius explicabo aut molestias voluptas itaque dolorum sunt quisquam. Totam, corrupti animi! Velit soluta repudiandae temporibus facere. Ad atque nihil quisquam amet deleniti doloremque, ut molestiae cumque quidem cum vitae voluptates dicta quas dolor"

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

// planets[0].content = planets[0].description

window.app = await ui({
  tag: "body.box-fit.box-v",
  style: { padding: "90px", background: "#aaa" },
  // plugins: ["persist"],
  content: [
    {
      tag: ".box-h",
      content: [
        {
          tag: ".box-center",
          content: {
            tag: ".pa._outset.resize.flex-v",
            style: { width: "380px", height: "200px" },
            content: {
              tag: "ui-tabs",
              id: "tabs1",
              // balanced: true,
              content: "{{planets}}",
              // content: [
              //   { label: "One", content: lorem },
              //   { label: "Two", content: "hello" },
              //   { label: "Three", content: "world" },
              // ],
            },
          },
        },
        {
          tag: ".box-center",
          content: {
            tag: ".pa._outset.resize.flex-v",
            style: { width: "400px", height: "200px" },
            content: {
              tag: "ui-tabs",
              id: "tabs2",
              side: "left",
              // balanced: true,
              content: [
                { label: "One", content: lorem },
                { label: "Two", content: "hello" },
                {
                  label: "Three Lorem Hello World Three Lorem Hello World",
                  content: "world",
                },
              ],
            },
          },
        },
      ],
    },
    {
      tag: ".box-h",
      content: [
        {
          tag: ".box-center",
          content: {
            tag: ".pa._outset.resize.flex-v",
            style: { width: "380px", height: "200px" },
            content: {
              tag: "ui-tabs",
              id: "tabs1",
              side: "bottom",
              content: "{{planets}}",
            },
          },
        },
        {
          tag: ".box-center",
          content: {
            tag: ".pa._outset.resize.flex-v",
            style: { width: "400px", height: "200px" },
            content: {
              tag: "ui-tabs",
              id: "tabs2",
              side: "right",
              content: [
                { label: "One", content: lorem },
                { label: "Two", content: "hello" },
                { label: "Three", content: "world" },
              ],
            },
          },
        },
      ],
    },
  ],

  state,
})
