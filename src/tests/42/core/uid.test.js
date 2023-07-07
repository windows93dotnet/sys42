import test from "../../../42/test.js"
import uid from "../../../42/core/uid.js"

const alphabet = Object.fromEntries(
  "abcdefghijklmnopqrstuvwxyz".split("").map((letter) => [letter, 0]),
)

function checkRandom(t, fn, size = 8, options) {
  const firstChar = structuredClone(alphabet)
  const reg = new RegExp(`^[a-z][\\dA-Za-z]{${size - 1}}$`)

  const check = options?.check ?? 200

  for (let i = 0; i < check; i++) {
    const id = fn()
    t.is(id.length, size)
    t.match(id, reg)
    firstChar[id[0]]++
  }

  for (const [letter, cnt] of Object.entries(firstChar)) {
    if (cnt === 0) t.fail(`${letter} never generated`)
  }
}

test.tasks(
  [
    { fn: () => uid() },
    { fn: () => uid(0), size: 4 },
    { fn: () => uid(-1), size: 4 },
    { fn: () => uid(1), size: 4 },
    { fn: () => uid(4), size: 4 },
    { fn: () => uid(14), size: 14 },
    { fn: () => uid(21), size: 21 },
  ],
  (test, { fn, size }) => {
    test.flaky(fn, async (t) => {
      checkRandom(t, fn, size)
    })
  },
)
