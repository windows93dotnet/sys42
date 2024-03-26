import test from "../../../42/test.js"
import log from "../../../42/core/log.js"
import logAsPlan from "../../../42/core/console/logAsPlan.js"
import logAsHTML from "../../../42/core/console/logAsHTML.js"

const debug = 0

function toHTML(str) {
  const div = document.createElement("div")
  div.append(logAsHTML(str))
  if (debug) document.body.append(div)
  return div.innerHTML
}

test.tasks(
  [
    {
      str: "a {red b} c",
      html: '<span>a </span><span class="ansi-red">b</span><span> c</span>',
      plan: [
        { tag: "span", content: "a " },
        { tag: "span.ansi-red", content: "b" },
        { tag: "span", content: " c" },
      ],
    },
    {
      str: "{green A {red B} C} D",
      html: '<span class="ansi-green">A </span><span class="ansi-red">B</span><span class="ansi-green"> C</span><span> D</span>',
      plan: [
        { tag: "span.ansi-green", content: "A " },
        { tag: "span.ansi-red", content: "B" },
        { tag: "span.ansi-green", content: " C" },
        { tag: "span", content: " D" },
      ],
    },
    {
      str: "{dim.red A }{red B }{dim.red C }{cyan D}",
      html: '<span class="ansi-dim ansi-red">A </span><span class="ansi-red">B </span><span class="ansi-dim ansi-red">C </span><span class="ansi-cyan">D</span>',
      plan: [
        { tag: "span.ansi-dim.ansi-red", content: "A " },
        { tag: "span.ansi-red", content: "B " },
        { tag: "span.ansi-dim.ansi-red", content: "C " },
        { tag: "span.ansi-cyan", content: "D" },
      ],
    },
  ],
  (test, { str, html, plan }) => {
    test((t) => {
      if (debug) log(str)
      if (html) t.is(toHTML(str), html)
      if (plan) t.eq(logAsPlan(str), plan)
    })
  },
)
