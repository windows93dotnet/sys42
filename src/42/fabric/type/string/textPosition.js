//! Copyright (c) 2016 Titus Wormer <tituswormer@gmail.com>. MIT License.
// @src https://github.com/vfile/vfile-location

export default function textPosition(text) {
  const value = String(text)

  const indices = []
  const search = /\r?\n|\r/g

  while (search.test(value)) indices.push(search.lastIndex)

  indices.push(value.length + 1)

  function toPoint(offset) {
    let index = -1

    if (offset > -1 && offset < indices[indices.length - 1]) {
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

  function toOffset(point) {
    const line = Number(point?.line)
    const column = Number(point?.column)

    let offset

    if (
      !Number.isNaN(line) && //
      !Number.isNaN(column) &&
      line - 1 in indices
    ) {
      offset = (indices[line - 2] ?? 0) + column - 1
    }

    return offset > -1 && offset < indices[indices.length - 1] ? offset : -1
  }

  return { toPoint, toOffset }
}
