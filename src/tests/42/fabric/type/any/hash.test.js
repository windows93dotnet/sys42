import test from "../../../../../42/test.js"
import hash from "../../../../../42/fabric/type/any/hash.js"

const { task } = test
const { stringify } = test.utils

const trace = false
const traces = []
function evaluate(actual) {
  if (trace) traces.push({ actual, expected: hash(actual) })
}

function display() {
  if (trace) {
    let out = ""
    for (const t of traces) {
      out += "task(" + stringify.line(t) + "),\n"
    }

    console.log(out)
  }
}

test.tasks(
  [
    task({ actual: 0, expected: "nogjpsxexjd3" }),
    task({ actual: 0.913_011_109_901_741_7, expected: "y9fdipkoe8ci" }),
    task({ actual: -1, expected: "qr9s4a6hhm7w" }),
    task({ actual: Infinity, expected: "mgwvoi2l2v3u" }),
    task({ actual: [], expected: "yirvnbjycpkj" }),
    task({ actual: {}, expected: "osxxeiz0spdr" }),
    task({ actual: { a: 1 }, expected: "kqy4k2jepz27" }),
    task({ actual: { a: "hello" }, expected: "z1fu6fr0nllv" }),
    task({ actual: [1], expected: "zhiiikghc9ra" }),
    task({ actual: ["a"], expected: "h0as53emgw68" }),
    task({ actual: Symbol("a"), expected: "e35zo73bkx9f" }),
    task({ actual: Symbol("b"), expected: "f37ea7427g9z" }),
    task({ actual: Symbol.for("a"), expected: "bx3sc0cne04x" }),
    task({ actual: Symbol.for("b"), expected: "cx3tq0co4mnx" }),
    task({ actual: "", expected: "qbszk5agfa19" }),
    task({ actual: "h", expected: "wrap5i3v6hwq" }),
    task({ actual: "he", expected: "t20sl8d4b92g" }),
    task({ actual: "hel", expected: "beuhxfb1bt6a" }),
    task({ actual: "hell", expected: "lett8wcxw89c" }),
    task({ actual: "hello", expected: "u8iysa3vnr09" }),
    task({ actual: "hello ", expected: "ask5vyku084p" }),
    task({ actual: "hello w", expected: "jukni0pklnpv" }),
    task({ actual: "hello wo", expected: "goj8duca1dj1" }),
    task({ actual: "hello wor", expected: "kk7a0vfrtt8u" }),
    task({ actual: "hello worl", expected: "knr0bfhsqgm5" }),
    task({ actual: "hello world", expected: "qwha85n7v7be" }),
    task({
      actual:
        "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium.",
      expected: "yg2tee7irvpd",
    }),
  ],
  (test, { actual, expected }) => {
    evaluate(actual)

    test(actual, (t) => {
      const res = hash(actual)
      t.match(res, /[a-z][\da-z]{11}/)
      t.is(res, expected)
      t.is(hash(actual), expected, "Didn't repeat")
    })
  },
)

display()

const ALPHANUMERIC = {}
for (let i = 0; i < 36; i++) ALPHANUMERIC[i.toString(36)] = ""

test.flaky("check hash distribution", (t) => {
  const inputs = []
  const distribution = []
  for (let i = 0; i < 11; i++) {
    distribution.push({ ...ALPHANUMERIC })
  }

  for (let i = 0; i < 10_000; i++) {
    const input = i ? Math.random() : i
    inputs.push(input)
    const res = hash(input)
    t.match(res, /[a-z][\da-z]{11}/, undefined, { input })
    for (let i = 0, l = res.length - 1; i < l; i++) {
      const char = res[i + 1]
      distribution[i][char] += "#"
    }
  }

  if (
    distribution.every((x) => Object.values(x).every((n) => n.length > 2)) ===
    false
  ) {
    t.fail("bad distribution")
    test.utils.log(inputs)
    test.utils.log(distribution)
  }
})
