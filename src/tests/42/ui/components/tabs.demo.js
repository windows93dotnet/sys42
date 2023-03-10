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

window.app = await ui({
  tag: "body.box-fit.box-v.ground",
  style: { padding: "90px" },
  // plugins: ["persist"],
  content: [
    { tag: "h2._item-shrink", content: "ui-tabs" },
    {
      tag: ".box-h",
      content: [
        {
          tag: "._box-center",
          content: {
            tag: ".pa._outset.resize.flex-v",
            style: { width: "420px", height: "200px" },
            content: {
              tag: "ui-tabs",
              id: "tabs1",
              transferable: true,
              closable: true,
              // balanced: true,
              items: "{{planets}}",
            },
          },
        },
        {
          tag: "._box-center",
          content: {
            tag: ".pa._outset.resize.flex-v",
            style: { width: "400px", height: "200px" },
            content: {
              tag: "ui-tabs",
              id: "tabs2",
              side: "left",
              transferable: true,
              // balanced: true,
              items: [
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
      tag: "ui-sandbox.inset",
      permissions: "app",
      content: {
        tag: ".box-h",
        content: [
          {
            tag: "._box-center",
            content: {
              tag: ".pa._outset.resize.flex-v",
              style: { width: "420px", height: "200px" },
              content: {
                tag: "ui-tabs",
                id: "tabs3",
                side: "bottom",
                transferable: true,
                closable: true,
                items: "{{planets}}",
              },
            },
          },
          {
            tag: "._box-center",
            content: {
              tag: ".pa._outset.resize.flex-v",
              // style: { width: "400px", height: "200px" },
              style: { width: "380px", height: "200px" },
              content: {
                tag: "ui-tabs",
                id: "tabs4",
                side: "right",
                transferable: true,
                items: [
                  { label: "One", content: lorem },
                  { label: "Two", content: "hello" },
                  { label: "Three", content: "world" },
                ],
              },
            },
          },
        ],
      },
    },

    // {
    //   tag: ".desktop.bd",
    //   transferable: true,
    // },
  ],

  state,
})
