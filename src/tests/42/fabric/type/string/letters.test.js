import test from "../../../../../42/test.js"
import letters from "../../../../../42/fabric/type/string/letters.js"

// @src https://github.com/nbubna/Case/blob/master/test/Case_test.js
const types = {
  Camel: "thisIsNiceAndTidyNathan",
  Pascal: "ThisIsNiceAndTidyNathan",
  Snake: "this_is_nice_and_tidy_nathan",
  Kebab: "this-is-nice-and-tidy-nathan",
  Upper: "THIS IS NICE AND TIDY NATHAN",
  Lower: "this is nice and tidy nathan",
  Header: "This-Is-Nice-And-Tidy-Nathan",
  // Sentence: "This is nice and tidy nathan",
  Capital: "This Is Nice And Tidy Nathan",
  Title: "This Is Nice and Tidy Nathan",
  Constant: "THIS_IS_NICE_AND_TIDY_NATHAN",
}

test("letters", (t) => {
  for (const [key, expected] of Object.entries(types)) {
    const method = `to${key}Case`
    if (method in letters) {
      for (const origin of Object.values(types)) {
        t.is(letters[method](origin), expected, { origin, method })
      }
    }
  }
})
