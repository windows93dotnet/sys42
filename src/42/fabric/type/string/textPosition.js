//! Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com>. MIT License.
// @src https://github.com/vfile/vfile-location

const SEARCH_REGEX = /\r?\n|\r/g

export class TextPosition {
  indices = []

  constructor(text) {
    this.update(text)
  }

  update(text) {
    const value = String(text)
    this.indices.length = 0
    SEARCH_REGEX.lastIndex = 0
    while (SEARCH_REGEX.test(value)) this.indices.push(SEARCH_REGEX.lastIndex)
    this.indices.push(value.length + 1)
  }

  toPoint(offset) {
    const { indices } = this
    let index = -1

    if (offset > -1 && offset < indices.at(-1)) {
      while (++index < indices.length) {
        if (indices[index] > offset) {
          return {
            line: index + 1,
            column: offset - (indices[index - 1] ?? 0) + 1,
          }
        }
      }
    }

    return { line: undefined, column: undefined }
  }

  toOffset(point) {
    const { indices } = this
    const line = Number.parseInt(point?.line, 10)
    const column = Number.parseInt(point?.column, 10)

    let offset

    if (
      !Number.isNaN(line) && //
      !Number.isNaN(column) &&
      line - 1 in indices
    ) {
      offset = (indices[line - 2] ?? 0) + column - 1
    }

    return offset > -1 && offset < indices.at(-1) ? offset : -1
  }
}

export function textPosition(text) {
  return new TextPosition(text)
}

export default textPosition
