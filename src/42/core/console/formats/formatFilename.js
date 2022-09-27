import parsePath from "../../../core/path/core/parsePath.js"

import inBackend from "../../env/runtime/inBackend.js"
import isObject from "../../../fabric/type/any/is/isObject.js"

import configure from "../../configure.js"
import { esc } from "../logUtils.js"
import shortenFilename from "../../../core/path/shortenFilename.js"
import bytesize from "../../../fabric/type/file/bytesize.js"

const DEFAULTS = {
  appendFullPath: !true,
  shorten: true,
  bytes: false,
  colors: {
    dir: "grey",
    name: "reset",
    ext: "grey",
    line: "dim",
    column: "grey",
    punctuation: "grey",
    bytes: "yellow",
  },
}

export default function formatFilename(stackframe, options) {
  const config = configure(
    DEFAULTS,
    typeof options === "string"
      ? { colors: { name: options, line: `${options}.dim` } }
      : options
  )

  const { colors, appendFullPath } = config

  const isStackframe = isObject(stackframe) && "filename" in stackframe

  const originalFilename = isStackframe ? stackframe.filename : stackframe

  const hasPosition =
    isStackframe &&
    !Number.isNaN(Number(stackframe.line)) &&
    !Number.isNaN(Number(stackframe.column))

  const { filename, href /* , protocol */ } = config.shorten
    ? shortenFilename(originalFilename, { object: true })
    : { filename: originalFilename, href: originalFilename }

  let { dir, name, ext } =
    filename === "./" ? { dir: "./", name: "", ext: "" } : parsePath(filename)

  dir = dir.endsWith("/") ? dir : dir + "/"

  let out = ""

  // devtools doesn't autolink when using color
  if (!inBackend && appendFullPath) {
    out += esc` {reset ${href}`
    out += hasPosition ? `:${stackframe.line}:${stackframe.column}}` : `}`
  } else {
    out = esc`{${colors.dir} ${dir}}{${colors.name} ${name}}{${colors.ext} ${ext}}`
    if (hasPosition) {
      out += `{${colors.dir}.dim :}{${colors.line} ${stackframe.line}}{${colors.column}.dim :${stackframe.column}}`
    }
  }

  if (config.bytes) {
    const { size, unit } = bytesize(config.bytes, { asString: false })
    out += `  {${colors.bytes} ${size}} {${colors.bytes}.dim ${unit}}`
  }

  return out
}
