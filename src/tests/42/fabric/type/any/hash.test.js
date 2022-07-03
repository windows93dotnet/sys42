import test from "../../../../../42/test.js"
import hash from "../../../../../42/fabric/type/any/hash.js"

const { task } = test

test.tasks(
  [
    task({ actual: "", expected: "a242404f3d5e" }),
    task({ actual: "h", expected: "a8ica6s27eda" }),
    task({ actual: "he", expected: "r1go67m3e309" }),
    task({ actual: "hel", expected: "nf5392l46977" }),
    task({ actual: "hell", expected: "tdbd0q33e322" }),
    task({ actual: "hello", expected: "ob7ko4i3455f" }),
    task({ actual: "hello ", expected: "g3kargsi21db" }),
    task({ actual: "hello w", expected: "j3akdfrf8494" }),
    task({ actual: "hello wo", expected: "y3d2mmuq1fbf" }),
    task({ actual: "hello wor", expected: "y6dbbjo1de21" }),
    task({ actual: "hello worl", expected: "k3blg0f01f56" }),
    task({ actual: "hello world", expected: "ecl1k01d78a8" }),
    task({
      actual:
        "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium.",
      expected: "q2tr2vjq1b50",
    }),
    task({ actual: 0, expected: "w1g6fc23ac00" }),
    task({ actual: -1, expected: "e2q2q468e051" }),
    task({ actual: Infinity, expected: "q1l3c338f74a" }),
    task({ actual: [], expected: "c16p17o8b498" }),
    task({ actual: {}, expected: "c7m7m211ea95" }),
    task({ actual: { a: 1 }, expected: "q1g6ejd0e074" }),
    task({ actual: { a: "hello" }, expected: "xssu9rv8698f" }),
    task({ actual: [1], expected: "vmg13q768c76" }),
    task({ actual: ["a"], expected: "d21d6pql1309" }),
    task({ actual: Symbol("a"), expected: "i1d6mamod285" }),
    task({ actual: Symbol("b"), expected: "h1d6oaond288" }),
    task({ actual: Symbol.for("a"), expected: "h3sgugst243e" }),
    task({ actual: Symbol.for("b"), expected: "g3sh0gus243e" }),
  ],
  (test, { actual, expected }) => {
    test(actual, (t) => {
      const res = hash(actual)
      t.match(res, /[a-z][\da-z]{11}/)
      t.is(res, expected)
      t.is(hash(actual), expected, "Didn't repeat")
    })
  }
)

test.flaky("check hash format", (t) => {
  let startWithA = false
  let startWithZ = false

  for (let i = 0; i < 1000; i++) {
    const res = hash(Math.random())
    t.match(res, /[a-z][\da-z]{11}/)
    if (res[0] === "a") startWithA = true
    if (res[0] === "z") startWithZ = true
  }

  t.true(startWithA, "at least one hash should start with a")
  t.true(startWithZ, "at least one hash should start with z")
})
