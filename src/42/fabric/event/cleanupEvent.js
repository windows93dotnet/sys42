export function normalizeOptions(options) {
  if (options.prevent || options.disrupt) {
    options.preventDefault = true
  }

  if (options.stop || options.disrupt) {
    options.stopPropagation = true
    options.stopImmediatePropagation = true
  }

  return options
}

export function runCleanup(e, options) {
  if (options.preventDefault) e.preventDefault()
  if (options.stopPropagation) e.stopPropagation()
  if (options.stopImmediatePropagation) e.stopImmediatePropagation()
}

export function cleanupEvent(e, options) {
  if (!options) return
  runCleanup(e, normalizeOptions(options))
}

cleanupEvent.run = runCleanup
cleanupEvent.normalize = normalizeOptions

export default cleanupEvent
