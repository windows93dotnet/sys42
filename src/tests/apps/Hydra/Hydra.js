import alert from "../../../42/ui/invocables/alert.js"

async function hydra() {
  await alert({
    label: "HYDRA",
    img: $manifest.icons[0].src,
    x: Math.round(Math.random() * (window.innerWidth - 300)),
    y: Math.round(Math.random() * (window.innerHeight - 118)),
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
