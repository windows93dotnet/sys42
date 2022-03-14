const languages = []

function makeLanguages() {
  languages.length = 0
  const set = new Set()

  if (globalThis.navigator?.languages?.length > 0) {
    for (const item of navigator.languages) {
      const { baseName, language } = new Intl.Locale(item)
      set.add(baseName)
      set.add(language)
    }
  } else {
    const { locale } = Intl.DateTimeFormat().resolvedOptions()
    const { baseName, language } = new Intl.Locale(locale)
    set.add(baseName)
    set.add(language)
  }

  // always fallback to english
  set.add("en-US")
  set.add("en")

  for (const language of set) languages.push(language)
}

globalThis.addEventListener?.("languagechange", makeLanguages)
makeLanguages()

export default languages
