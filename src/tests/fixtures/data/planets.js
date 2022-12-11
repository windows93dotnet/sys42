// @src https://hitchhikers.fandom.com/
// cspell:disable

import freeze from "../../../42/fabric/type/object/freeze.js"

export const planets = freeze([
  {
    name: "Magrathea",
    description:
      "Magrathea is an ancient planet located in orbit around the twin suns Soulianis and Rahm in the heart of the Horsehead Nebula.",
    location: "Heart of the Horsehead Nebula",
    status: "Closed, was briefly opened",
    species: ["Magratheans"],
  },
  {
    name: "Earth",
    description:
      "Earth was a giant supercomputer designed to find the Ultimate Question of Life, the Universe and Everything. Designed by Deep Thought and built by the Magratheans, it was commonly mistaken for a planet,",
    location: "Solar System, Milky Way",
    status: "Destroyed",
    species: ["Dolphins", "Humans", "Mices"],
    moons: ["The Moon"],
  },
  {
    name: "Damogran",
    description:
      "Damogran is a planet that is approximately 2,500 light years from Earth on the fashionable Eastern Side of the Galaxy.",
    location: "Eastern Side of the Galaxy",
    status: "Inhabited",
    species: ["Damogran Frond Crested Eagle", "Damogranian Pom-Pom Squid"],
  },
  {
    name: "Vogsphere",
    description:
      "Vogsphere is the homeworld of the Vogons. It is also the home of Scintillating Jewelled Scuttling Crabs, and is near the Vogsol star.",
    location: "Vogsol system",
    status: "Inhabited",
    species: [
      "Vogons",
      "Scintillating Jewelled Scuttling Crabs",
      "Gazelle-like animals",
    ],
  },
])

export default planets
