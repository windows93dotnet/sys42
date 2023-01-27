import alert from "../../../42/ui/invocables/alert.js"

const icon = new URL("./icon-32.png", import.meta.url).href

async function hydra() {
  await alert({
    dialog: {
      style: { position: "absolute", top: 0, left: 0 },
      x: Math.round(Math.random() * (window.innerWidth - 300)),
      y: Math.round(Math.random() * (window.innerHeight - 118)),
    },
    label: "HYDRA",
    img: icon,
    content: [
      "Cut off a head, two more will take its place.",
      "<br>",
      "[ Hydra ViRuS BioCoded by Typhon/Échidna ]",
    ],
  })

  hydra()
  hydra()
}

hydra()
