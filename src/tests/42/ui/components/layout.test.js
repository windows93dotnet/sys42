// import test from "../../../../42/test.js"
import ui from "../../../../42/ui.js"

const lorem =
  "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quas, quo quidem voluptate, consectetur, sint repellendus expedita consequatur pariatur delectus cum inventore iure aperiam? Ad facere nemo tenetur nesciunt quam autem voluptatibus vel temporibus dolorem atque. Dolores beatae magnam iure, architecto eius explicabo aut molestias voluptas itaque dolorum sunt quisquam. Totam, corrupti animi! Velit soluta repudiandae temporibus facere. Ad atque nihil quisquam amet deleniti doloremque, ut molestiae cumque quidem cum vitae voluptates dicta quas dolor, nam ipsum laboriosam odit iusto animi, fugit tempore saepe vero corrupti cupiditate! Nam numquam mollitia esse quam labore, laborum sequi optio consequuntur natus ex, corporis quae?"

ui({
  tag: "body.box-fit.box-h",
  content: [
    {
      tag: ".box-center",
      content: {
        tag: ".pa.outset.resize",
        style: { width: "300px", height: "100px" },
        content: {
          tag: "ui-tabs",
          currentTab: 2,
          content: [
            { label: "One", content: lorem }, //
            { label: "Two", content: "yo" },
          ],
        },
      },
    },
    {
      tag: ".box-center",
      content: {
        tag: ".pa.outset.resize.flex-v",
        style: { width: "300px", height: "100px" },
        content: {
          tag: "ui-tabs",
          content: [
            { label: "One", content: lorem }, //
            { label: "Two", content: "yo" },
          ],
        },
      },
    },
  ],
})
