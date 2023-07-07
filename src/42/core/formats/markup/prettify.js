//! Copyright (c) 2020 Dominik Michal. MIT License.
// @src https://github.com/Dmc0125/html-prettify

/**
 * @param {string[]} splittedHtml
 * @param {{ char?: string; count?: number }} options
 * @returns {string}
 */
const addIndentation = (splittedHtml, options = {}) => {
  const char = options.char || " "
  const count = options.count || 2

  let level = 0
  const opened = []

  const indented = []

  for (const tag of splittedHtml.reverse()) {
    if (
      opened.length > 0 &&
      level &&
      opened[level] &&
      /* if current element tag is the same as previously opened one */
      opened[level] === tag.slice(1, opened[level].length + 1)
    ) {
      opened.splice(level, 1)
      level--
    }

    const indentation = char.repeat(level ? level * count : 0)

    indented.unshift(`${indentation}${tag}`)

    // if current element tag is closing tag
    // add it to opened elements
    if (tag.startsWith("</")) {
      level++
      opened[level] = tag.slice(2, -1)
    }
  }

  return indented.join("\n")
}

/**
 * @param {string} nonFormattedString any non formatted string
 * @returns {string[]} Array of strings separated on new lines
 */
const removeEmptyLines = (nonFormattedString) =>
  // Replace
  // - 1 or more spaces or tabs at the start of line
  // - 1 or more spaces or tabs at the end of line
  // - empty lines
  // with empty string
  nonFormattedString.trim().replace(/(^(\s|\t)+|(( |\t)+)$)/gm, "")

/**
 * @param {string} markup
 * @returns {string[]} array of strings splitted on new lines without empty lines
 */
const mergeAttributesWithElements = (markup) => {
  const splittedMarkup = removeEmptyLines(markup).split("\n")

  const mergedLines = []
  let currentElement = ""
  for (const line of splittedMarkup) {
    // If line is closing element/tag separate closing tag from rest of the line with space
    if (line.endsWith("/>")) {
      mergedLines.push(`${currentElement}${line.slice(0, -2)} />`)
      currentElement = ""

      continue
    }

    if (line.endsWith(">")) {
      mergedLines.push(
        `${currentElement}${
          line.startsWith(">") || line.startsWith("<") ? "" : " "
        }${line}`,
      )
      currentElement = ""

      continue
    }

    currentElement += currentElement.length > 0 ? ` ${line}` : line
  }

  return mergedLines
}

/**
 * @param {string} markup
 * @param {{ char?: string; count?: number }} options
 * @returns {string}
 */
export default function prettify(markup, options = {}) {
  const splitted = mergeAttributesWithElements(markup.replaceAll("><", ">\n<"))
  return addIndentation(splitted, options)
}
