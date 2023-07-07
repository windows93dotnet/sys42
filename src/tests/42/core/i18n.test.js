import test from "../../../42/test.js"
import i18n from "../../../42/core/i18n.js"
import system from "../../../42/system.js"

let savedConfig
test.setup(() => {
  const { locale, languages, db } = system.i18n
  savedConfig = { locale, languages, db }

  system.i18n.languages = ["en-US", "en"]
  system.i18n.locale = "en-US"
  system.i18n.db = {
    fr: {
      global: {
        "coffee": "café",
        "horse": "cheval",
        "hello": "bonjour",
        "hello {{0}}": "bonjour {{0}}",
        "hello {{0}}, give me {{1}}": "bonjour {{0}}, donne moi {{1}}",
      },
      alt: {
        "hello {{0}}, give me {{1}}": "passe moi {{1}} s'il te plait {{0}}",
      },
      plurals: {
        horse: "chevaux",
      },
    },
    en: {
      plurals: {
        coffee: "coffee",
      },
    },
  }
})

test.teardown(() => {
  Object.assign(system.i18n, savedConfig)
})

test("choose prefered language", (t) => {
  system.i18n.languages = ["en-US", "en"]
  system.i18n.locale = "en-US"
  t.is(i18n`hello`, "hello")
  system.i18n.locale = "ru"
  t.is(i18n`hello`, "hello", "should fallback to default locale")
  system.i18n.languages = ["es", "fr", "en-US", "en"]
  system.i18n.locale = "fr"
  t.is(i18n`hello`, "bonjour")
  system.i18n.locale = "es"
  t.is(i18n`hello`, "bonjour", "should fallback to previous matching locale")
})

test("plural", (t) => {
  system.i18n.languages = ["en-US", "en"]
  system.i18n.locale = "en-US"
  t.is(i18n.p`${1} horse`, "1 horse")
  t.is(i18n.p`${2} horse`, "2 horses")
})

test("plural", "fr", (t) => {
  system.i18n.languages = ["fr-FR", "fr"]
  system.i18n.locale = "fr-FR"
  t.is(i18n.p`${1} horse`, "1 cheval")
  t.is(i18n.p`${2} horse`, "2 chevaux")
})

test("en", (t) => {
  system.i18n.languages = ["en-US", "en"]
  system.i18n.locale = "en-US"
  t.is(
    i18n`hello ${"Marvin"}, give me ${i18n.p`${3000} coffee`}`,
    "hello Marvin, give me 3,000 coffee",
  )
})

test("fr", (t) => {
  system.i18n.languages = ["fr-FR", "fr"]
  system.i18n.locale = "fr-FR"
  t.is(
    i18n`hello ${"Marvin"}, give me ${i18n.p`${3000} coffee`}`,
    "bonjour Marvin, donne moi 3\u202f000 cafés",
  )
})

test("fr", "alt", (t) => {
  system.i18n.languages = ["fr-FR", "fr"]
  system.i18n.locale = "fr-FR"
  const __ = i18n.for("alt")
  t.is(
    __`hello ${"Marvin"}, give me ${__.p`${3000} coffee`}`,
    "passe moi 3\u202f000 cafés s'il te plait Marvin",
  )
})

test("fr", "alt", "fallback to global context", (t) => {
  system.i18n.languages = ["fr-FR", "fr"]
  system.i18n.locale = "fr-FR"
  const __ = i18n.for("alt")
  t.is(__`hello ${"Marvin"}`, "bonjour Marvin")
})

test('i18n.locale("fr")', (t) => {
  system.i18n.languages = ["en-US", "en"]
  system.i18n.locale = "en-US"
  const __ = i18n.locale("fr")
  t.is(
    __`hello ${"Marvin"}, give me ${__.p`${3000} coffee`}`,
    "bonjour Marvin, donne moi 3\u202f000 cafés",
  )
})

test('i18n.locale("fr")', "alt", (t) => {
  system.i18n.languages = ["en-US", "en"]
  system.i18n.locale = "en-US"
  const __ = i18n.locale("fr").for("alt")
  t.is(
    __`hello ${"Marvin"}, give me ${__.p`${3000} coffee`}`,
    "passe moi 3\u202f000 cafés s'il te plait Marvin",
  )
})
