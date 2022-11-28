// import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"
// import puppet from "../../../../42/core/dev/puppet.js"

const lorem =
  "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quas, quo quidem voluptate, consectetur, sint repellendus expedita consequatur pariatur delectus cum inventore iure aperiam? Ad facere nemo tenetur nesciunt quam autem voluptatibus vel temporibus dolorem atque. Dolores beatae magnam iure, architecto eius explicabo aut molestias voluptas itaque dolorum sunt quisquam. Totam, corrupti animi! Velit soluta repudiandae temporibus facere. Ad atque nihil quisquam amet deleniti doloremque, ut molestiae cumque quidem cum vitae voluptates dicta quas dolor"

// @src https://hitchhikers.fandom.com/
const planets = [
  {
    name: "Earth",
    description:
      "Earth was a giant supercomputer designed to find the Ultimate Question of Life, the Universe and Everything. Designed by Deep Thought and built by the Magratheans, it was commonly mistaken for a planet,",
    // location: "Solar System, Milky Way",
    // status: "Destroyed",
    // species: ["Dolphins", "Humans", "Mices"],
    // moons: ["The Moon"],
  },
  {
    name: "Magrathea",
    // name: "Magrathea is an ancient planet located in orbit around the twin suns Soulianis and Rahm in the heart of the Horsehead Nebula.",
    description:
      "Magrathea is an ancient planet located in orbit around the twin suns Soulianis and Rahm in the heart of the Horsehead Nebula.",
    // location: "Heart of the Horsehead Nebula",
    // status: "Closed, was briefly opened",
    // species: ["Magratheans"],
  },
  {
    name: "Damogran",
    description:
      "Damogran is a planet that is approximately 2,500 light years from Earth on the fashionable Eastern Side of the Galaxy.",
    // location: "Eastern Side of the Galaxy",
    // status: "Inhabited",
    // species: ["Damogran Frond Crested Eagle", "Damogranian Pom-Pom Squid"],
  },
  {
    name: "Vogsphere",
    description:
      "Vogsphere is the homeworld of the Vogons. It is also the home of Scintillating Jewelled Scuttling Crabs, and is near the Vogsol star.",
    // location: "Vogsol system",
    // status: "Inhabited",
    // species: [
    //   "Vogons",
    //   "Scintillating Jewelled Scuttling Crabs",
    //   "Gazelle-like animals",
    // ],
  },
]

for (const item of planets) {
  item.label = item.name
  item.content = {
    tag: "textarea.size-full",
    // value: item.description,
    bind: "description",
    compact: true,
    autofocus: true,
  }
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
            style: { width: "350px", height: "200px" },
            content: {
              tag: "ui-tabs",
              id: "tabs1",
              // balanced: true,
              // content: "{{planets}}",
              content: [
                { label: "One", content: lorem },
                { label: "Two", content: "hello" },
                { label: "Three", content: "world" },
              ],
            },
          },
        },
        {
          tag: ".box-center",
          content: {
            tag: ".pa._outset.resize.flex-v",
            style: { width: "350px", height: "200px" },
            content: {
              tag: "ui-tabs",
              id: "tabs2",
              side: "left",
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
    {
      tag: ".box-h",
      content: [
        {
          tag: ".box-center",
          content: {
            tag: ".pa._outset.resize.flex-v",
            style: { width: "350px", height: "200px" },
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
            style: { width: "350px", height: "200px" },
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

  state: {
    planets,
  },
})

// await puppet("#tab-tabs1-3 .ui-tabs__close").click()

// setTimeout(() => {
//   const tabs = window.app.el.querySelector("#tabs2")
//   const [removed] = tabs.content.splice(0, 1)
//   tabs.content.splice(1, 0, removed)
//   tabs.current = 1
// }, 500)
