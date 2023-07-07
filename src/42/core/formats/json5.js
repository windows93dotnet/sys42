// {src:"golden-fleece",dest:"src/42/core/formats/json5.js",foot:"export default { ast: parse, parse: evaluate, format: patch, stringify }",eslint:{disable:true}}
/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */

function __extends(d, b) {
  for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]
  function __() {
    this.constructor = d
  }
  d.prototype =
    b === null ? Object.create(b) : ((__.prototype = b.prototype), new __())
}

var whitespace = /\s/
var validIdentifierCharacters = /[a-zA-Z_$][a-zA-Z0-9_$]*/
var entirelyValidIdentifier = new RegExp(
  "^" + validIdentifierCharacters.source + "$",
)
var number =
  /^NaN|(?:[-+]?(?:(?:Infinity)|(?:0[xX][a-fA-F0-9]+)|(?:0[bB][01]+)|(?:0[oO][0-7]+)|(?:(?:(?:[1-9]\d*|0)?\.\d+|(?:[1-9]\d*|0)\.\d*|(?:[1-9]\d*|0))(?:[E|e][+|-]?\d+)?)))/
var SINGLE_QUOTE = "'"
var DOUBLE_QUOTE = '"'
function spaces(n) {
  var result = ""
  while (n--) result += " "
  return result
}

function getLocator(source, options) {
  if (options === void 0) {
    options = {}
  }
  var offsetLine = options.offsetLine || 0
  var offsetColumn = options.offsetColumn || 0
  var originalLines = source.split("\n")
  var start = 0
  var lineRanges = originalLines.map(function (line, i) {
    var end = start + line.length + 1
    var range = { start: start, end: end, line: i }
    start = end
    return range
  })
  var i = 0
  function rangeContains(range, index) {
    return range.start <= index && index < range.end
  }
  function getLocation(range, index) {
    return {
      line: offsetLine + range.line,
      column: offsetColumn + index - range.start,
      character: index,
    }
  }
  function locate(search, startIndex) {
    if (typeof search === "string") {
      search = source.indexOf(search, startIndex || 0)
    }
    var range = lineRanges[i]
    var d = search >= range.end ? 1 : -1
    while (range) {
      if (rangeContains(range, search)) return getLocation(range, search)
      i += d
      range = lineRanges[i]
    }
  }

  return locate
}
function locate(source, search, options) {
  if (typeof options === "number") {
    throw new Error(
      "locate takes a { startIndex, offsetLine, offsetColumn } object as the third argument",
    )
  }
  return getLocator(source, options)(search, options && options.startIndex)
}

function parse(str, opts) {
  var parser = new Parser(str, opts)
  return parser.value
}
function noop() {}
var ParseError = /** @class */ (function (_super) {
  __extends(ParseError, _super)
  function ParseError(message, pos, loc) {
    var _this = _super.call(this, message) || this
    _this.pos = pos
    _this.loc = loc
    return _this
  }
  return ParseError
})(Error)
// https://mathiasbynens.be/notes/javascript-escapes
var escapeable = {
  b: "\b",
  n: "\n",
  f: "\f",
  r: "\r",
  t: "\t",
  v: "\v",
  0: "\0",
}
var hex = /^[a-fA-F0-9]+$/
var Parser = /** @class */ (function () {
  function Parser(str, opts) {
    this.str = str
    this.index = 0
    this.onComment = (opts && opts.onComment) || noop
    this.onValue = (opts && opts.onValue) || noop
    this.value = this.readValue()
    this.allowWhitespaceOrComment()
    if (this.index < this.str.length) {
      throw new Error("Unexpected character '" + this.peek() + "'")
    }
  }
  Parser.prototype.allowWhitespaceOrComment = function () {
    while (
      this.index < this.str.length &&
      whitespace.test(this.str[this.index])
    ) {
      this.index++
    }
    var start = this.index
    if (this.eat("/")) {
      if (this.eat("/")) {
        // line comment
        var text = this.readUntil(/(?:\r\n|\n|\r)/)
        this.onComment({
          start: start,
          end: this.index,
          type: "Comment",
          text: text,
          block: false,
        })
        this.eat("\n")
      } else if (this.eat("*")) {
        // block comment
        var text = this.readUntil(/\*\//)
        this.onComment({
          start: start,
          end: this.index,
          type: "Comment",
          text: text,
          block: true,
        })
        this.eat("*/", true)
      }
    } else {
      return
    }
    this.allowWhitespaceOrComment()
  }
  Parser.prototype.error = function (message, index) {
    if (index === void 0) {
      index = this.index
    }
    var loc = locate(this.str, index, { offsetLine: 1 })
    throw new ParseError(message, index, loc)
  }
  Parser.prototype.eat = function (str, required) {
    if (this.str.slice(this.index, this.index + str.length) === str) {
      this.index += str.length
      return str
    }
    if (required) {
      this.error(
        "Expected '" + str + "' instead of '" + this.str[this.index] + "'",
      )
    }
    return null
  }
  Parser.prototype.peek = function () {
    return this.str[this.index]
  }
  Parser.prototype.read = function (pattern) {
    var match = pattern.exec(this.str.slice(this.index))
    if (!match || match.index !== 0) return null
    this.index += match[0].length
    return match[0]
  }
  Parser.prototype.readUntil = function (pattern) {
    if (this.index >= this.str.length) this.error("Unexpected end of input")
    var start = this.index
    var match = pattern.exec(this.str.slice(start))
    if (match) {
      var start_1 = this.index
      this.index = start_1 + match.index
      return this.str.slice(start_1, this.index)
    }
    this.index = this.str.length
    return this.str.slice(start)
  }
  Parser.prototype.readArray = function () {
    var start = this.index
    if (!this.eat("[")) return null
    var array = {
      start: start,
      end: null,
      type: "ArrayExpression",
      elements: [],
    }
    this.allowWhitespaceOrComment()
    while (this.peek() !== "]") {
      array.elements.push(this.readValue())
      this.allowWhitespaceOrComment()
      if (!this.eat(",")) break
      this.allowWhitespaceOrComment()
    }
    if (!this.eat("]")) {
      this.error("Expected ']' instead of '" + this.str[this.index] + "'")
    }
    array.end = this.index
    return array
  }
  Parser.prototype.readBoolean = function () {
    var start = this.index
    var raw = this.read(/^(true|false)/)
    if (raw) {
      return {
        start: start,
        end: this.index,
        type: "Literal",
        raw: raw,
        value: raw === "true",
      }
    }
  }
  Parser.prototype.readNull = function () {
    var start = this.index
    if (this.eat("null")) {
      return {
        start: start,
        end: this.index,
        type: "Literal",
        raw: "null",
        value: null,
      }
    }
  }
  Parser.prototype.readLiteral = function () {
    return (
      this.readBoolean() ||
      this.readNumber() ||
      this.readString() ||
      this.readNull()
    )
  }
  Parser.prototype.readNumber = function () {
    var start = this.index
    var raw = this.read(number)
    if (raw) {
      var sign = raw[0]
      var value = +(sign === "-" || sign === "+" ? raw.slice(1) : raw)
      if (sign === "-") value = -value
      return {
        start: start,
        end: this.index,
        type: "Literal",
        raw: raw,
        value: value,
      }
    }
  }
  Parser.prototype.readObject = function () {
    var start = this.index
    if (!this.eat("{")) return
    var object = {
      start: start,
      end: null,
      type: "ObjectExpression",
      properties: [],
    }
    this.allowWhitespaceOrComment()
    while (this.peek() !== "}") {
      object.properties.push(this.readProperty())
      this.allowWhitespaceOrComment()
      if (!this.eat(",")) break
      this.allowWhitespaceOrComment()
    }
    this.eat("}", true)
    object.end = this.index
    return object
  }
  Parser.prototype.readProperty = function () {
    this.allowWhitespaceOrComment()
    var property = {
      start: this.index,
      end: null,
      type: "Property",
      key: this.readPropertyKey(),
      value: this.readValue(),
    }
    property.end = this.index
    return property
  }
  Parser.prototype.readIdentifier = function () {
    var start = this.index
    var name = this.read(validIdentifierCharacters)
    if (name) {
      return {
        start: start,
        end: this.index,
        type: "Identifier",
        name: name,
      }
    }
  }
  Parser.prototype.readPropertyKey = function () {
    var key = this.readString() || this.readIdentifier()
    if (!key) this.error("Bad identifier as unquoted key")
    if (key.type === "Literal") {
      key.name = String(key.value)
    }
    this.allowWhitespaceOrComment()
    this.eat(":", true)
    return key
  }
  Parser.prototype.readString = function () {
    var start = this.index
    // const quote = this.read(/^['"]/);
    var quote = this.eat(SINGLE_QUOTE) || this.eat(DOUBLE_QUOTE)
    if (!quote) return
    var escaped = false
    var value = ""
    while (this.index < this.str.length) {
      var char_1 = this.str[this.index++]
      if (escaped) {
        escaped = false
        // line continuations
        if (char_1 === "\n") continue
        if (char_1 === "\r") {
          if (this.str[this.index] === "\n") this.index += 1
          continue
        }
        if (char_1 === "x" || char_1 === "u") {
          var start_2 = this.index
          var end = (this.index += char_1 === "x" ? 2 : 4)
          var code = this.str.slice(start_2, end)
          if (!hex.test(code))
            this.error(
              "Invalid " +
                (char_1 === "x" ? "hexadecimal" : "Unicode") +
                " escape sequence",
              start_2,
            )
          value += String.fromCharCode(parseInt(code, 16))
        } else {
          value += escapeable[char_1] || char_1
        }
      } else if (char_1 === "\\") {
        escaped = true
      } else if (char_1 === quote) {
        var end = this.index
        return {
          start: start,
          end: end,
          type: "Literal",
          raw: this.str.slice(start, end),
          value: value,
        }
      } else {
        if (char_1 === "\n") this.error("Bad string", this.index - 1)
        value += char_1
      }
    }
    this.error("Unexpected end of input")
  }
  Parser.prototype.readValue = function () {
    this.allowWhitespaceOrComment()
    var value = this.readArray() || this.readObject() || this.readLiteral()
    if (value) {
      this.onValue(value)
      return value
    }
    this.error("Unexpected EOF")
  }
  return Parser
})()

function evaluate(str) {
  var ast = parse(str)
  return getValue(ast)
}
function getValue(node) {
  if (node.type === "Literal") {
    return node.value
  }
  if (node.type === "ArrayExpression") {
    return node.elements.map(getValue)
  }
  if (node.type === "ObjectExpression") {
    var obj_1 = {}
    node.properties.forEach(function (prop) {
      obj_1[prop.key.name] = getValue(prop.value)
    })
    return obj_1
  }
}

function stringify(value, options) {
  var quote = options && options.singleQuotes ? "'" : '"'
  var indentString = options && options.spaces ? spaces(options.spaces) : "\t"
  return stringifyValue(value, quote, "\n", indentString, true)
}
// https://github.com/json5/json5/blob/65bcc556eb629984b33bb2163cbc10fba4597300/src/stringify.js#L110
var escapeable$1 = {
  "'": "'",
  '"': '"',
  "\\": "\\",
  "\b": "b",
  "\f": "f",
  "\n": "n",
  "\r": "r",
  "\t": "t",
  "\v": "v",
  "\0": "0",
  "\u2028": "u2028",
  "\u2029": "u2029",
}
var escapeableRegex = /['"\\\b\f\n\r\t\v\0\u2028\u2029]/g
function stringifyString(str, quote) {
  var otherQuote = quote === '"' ? "'" : '"'
  return (
    quote +
    str.replace(escapeableRegex, function (char) {
      return char === otherQuote ? char : "\\" + escapeable$1[char]
    }) +
    quote
  )
}
function stringifyProperty(
  key,
  value,
  quote,
  indentation,
  indentString,
  newlines,
) {
  return (
    (entirelyValidIdentifier.test(key) ? key : stringifyString(key, quote)) +
    ": " +
    stringifyValue(value, quote, indentation, indentString, newlines)
  )
}
function stringifyValue(value, quote, indentation, indentString, newlines) {
  var type = typeof value
  if (type === "string") {
    return stringifyString(value, quote)
  }
  if (type === "number" || type === "boolean" || value === null)
    return String(value)
  if (Array.isArray(value)) {
    var elements = value.map(function (element) {
      return stringifyValue(
        element,
        quote,
        indentation + indentString,
        indentString,
        true,
      )
    })
    if (newlines) {
      return (
        "[\n" +
        (indentation + indentString) +
        elements.join(",\n" + (indentation + indentString)) +
        ("\n" + indentation + "]")
      )
    }
    return "[ " + elements.join(", ") + " ]"
  }
  if (type === "object") {
    var keys = Object.keys(value)
    var properties = keys.map(function (key) {
      return stringifyProperty(
        key,
        value[key],
        quote,
        indentation + indentString,
        indentString,
        newlines,
      )
    })
    if (newlines) {
      return (
        "{" +
        (indentation + indentString) +
        properties.join("," + (indentation + indentString)) +
        (indentation + "}")
      )
    }
    return "{ " + properties.join(", ") + " }"
  }
  throw new Error("Cannot stringify " + type)
}

function patch(str, value) {
  var counts = {}
  counts[SINGLE_QUOTE] = 0
  counts[DOUBLE_QUOTE] = 0
  var indentString = guessIndentString(str)
  var root = parse(str, {
    onValue: function (node) {
      if (node.type === "Literal" && typeof node.value === "string") {
        counts[node.raw[0]] += 1
      }
    },
  })
  var quote =
    counts[SINGLE_QUOTE] > counts[DOUBLE_QUOTE] ? SINGLE_QUOTE : DOUBLE_QUOTE
  var newlines =
    /\n/.test(str.slice(root.start, root.end)) ||
    (root.type === "ArrayExpression" && root.elements.length === 0) ||
    (root.type === "ObjectExpression" && root.properties.length === 0)
  return (
    str.slice(0, root.start) +
    patchValue(root, value, str, "", indentString, quote, newlines) +
    str.slice(root.end)
  )
}
function patchValue(
  node,
  value,
  str,
  indentation,
  indentString,
  quote,
  newlines,
) {
  var type = typeof value
  if (type === "string") {
    if (node.type === "Literal" && typeof node.value === "string") {
      // preserve quote style
      return stringifyString(value, node.raw[0])
    }
    return stringifyString(value, quote)
  }
  if (type === "number") {
    return patchNumber(node.raw, value)
  }
  if (type === "boolean" || value === null) {
    return String(value)
  }
  if (Array.isArray(value)) {
    if (node.type === "ArrayExpression") {
      return patchArray(node, value, str, indentation, indentString, quote)
    }
    return stringifyValue(value, quote, indentation, indentString, newlines)
  }
  if (type === "object") {
    if (node.type === "ObjectExpression") {
      return patchObject(node, value, str, indentation, indentString, quote)
    }
    return stringifyValue(value, quote, indentation, indentString, newlines)
  }
  throw new Error("Cannot stringify " + type + "s")
}
function patchNumber(raw, value) {
  var matchRadix = /^([-+])?0([boxBOX])/.exec(raw)
  if (matchRadix && value % 1 === 0) {
    return (
      (matchRadix[1] === "+" && value >= 0 ? "+" : value < 0 ? "-" : "") +
      "0" +
      matchRadix[2] +
      Math.abs(value).toString(
        matchRadix[2] === "b" || matchRadix[2] === "B"
          ? 2
          : matchRadix[2] === "o" || matchRadix[2] === "O"
          ? 8
          : matchRadix[2] === "x" || matchRadix[2] === "X"
          ? 16
          : null,
      )
    )
  }
  var match = /^([-+])?(\.)?/.exec(raw)
  if (match && match[0].length > 0) {
    return (
      (match[1] === "+" && value >= 0 ? "+" : value < 0 ? "-" : "") +
      (match[2]
        ? String(Math.abs(value)).replace(/^0/, "")
        : String(Math.abs(value)))
    )
  }
  return String(value)
}
function patchArray(
  node,
  value,
  str,
  indentation,
  indentString,
  quote,
  newlines,
) {
  if (value.length === 0) {
    return node.elements.length === 0 ? str.slice(node.start, node.end) : "[]"
  }
  var precedingWhitespace = getPrecedingWhitespace(str, node.start)
  var empty = precedingWhitespace === ""
  var newline = empty || /\n/.test(precedingWhitespace)
  if (node.elements.length === 0) {
    return stringifyValue(value, quote, indentation, indentString, newline)
  }
  var i = 0
  var c = node.start
  var patched = ""
  var newlinesInsideValue =
    str.slice(node.start, node.end).split("\n").length > 1
  for (; i < value.length; i += 1) {
    var element = node.elements[i]
    if (element) {
      patched +=
        str.slice(c, element.start) +
        patchValue(
          element,
          value[i],
          str,
          indentation,
          indentString,
          quote,
          newlinesInsideValue,
        )
      c = element.end
    } else {
      // append new element
      if (newlinesInsideValue) {
        patched +=
          ",\n" +
          (indentation + indentString) +
          stringifyValue(value[i], quote, indentation, indentString, true)
      } else {
        patched +=
          ", " +
          stringifyValue(value[i], quote, indentation, indentString, false)
      }
    }
  }
  if (i < node.elements.length) {
    c = node.elements[node.elements.length - 1].end
  }
  patched += str.slice(c, node.end)
  return patched
}
function patchObject(
  node,
  value,
  str,
  indentation,
  indentString,
  quote,
  newlines,
) {
  var keys = Object.keys(value)
  if (keys.length === 0) {
    return node.properties.length === 0 ? str.slice(node.start, node.end) : "{}"
  }
  var existingProperties = {}
  node.properties.forEach(function (prop) {
    existingProperties[prop.key.name] = prop
  })
  var precedingWhitespace = getPrecedingWhitespace(str, node.start)
  var empty = precedingWhitespace === ""
  var newline = empty || /\n/.test(precedingWhitespace)
  if (node.properties.length === 0) {
    return stringifyValue(value, quote, indentation, indentString, newline)
  }
  var i = 0
  var c = node.start
  var patched = ""
  var newlinesInsideValue = /\n/.test(str.slice(node.start, node.end))
  var started = false
  var intro = str.slice(node.start, node.properties[0].start)
  for (; i < node.properties.length; i += 1) {
    var property = node.properties[i]
    var propertyValue = value[property.key.name]
    indentation = getIndentation(str, property.start)
    if (propertyValue !== undefined) {
      patched += started
        ? str.slice(c, property.value.start)
        : intro + str.slice(property.key.start, property.value.start)
      patched += patchValue(
        property.value,
        propertyValue,
        str,
        indentation,
        indentString,
        quote,
        newlinesInsideValue,
      )
      started = true
    }
    c = property.end
  }
  // append new properties
  keys.forEach(function (key) {
    if (key in existingProperties) return
    var propertyValue = value[key]
    patched +=
      (started ? "," + (newlinesInsideValue ? indentation : " ") : intro) +
      stringifyProperty(
        key,
        propertyValue,
        quote,
        indentation,
        indentString,
        newlinesInsideValue,
      )
    started = true
  })
  patched += str.slice(c, node.end)
  return patched
}
function getIndentation(str, i) {
  while (i > 0 && !whitespace.test(str[i - 1])) i -= 1
  var end = i
  while (i > 0 && whitespace.test(str[i - 1])) i -= 1
  return str.slice(i, end)
}
function getPrecedingWhitespace(str, i) {
  var end = i
  while (i > 0 && whitespace.test(str[i])) i -= 1
  return str.slice(i, end)
}
function guessIndentString(str) {
  var lines = str.split("\n")
  var tabs = 0
  var spaces$$1 = 0
  var minSpaces = 8
  lines.forEach(function (line) {
    var match = /^(?: +|\t+)/.exec(line)
    if (!match) return
    var whitespace$$1 = match[0]
    if (whitespace$$1.length === line.length) return
    if (whitespace$$1[0] === "\t") {
      tabs += 1
    } else {
      spaces$$1 += 1
      if (whitespace$$1.length > 1 && whitespace$$1.length < minSpaces) {
        minSpaces = whitespace$$1.length
      }
    }
  })
  if (spaces$$1 > tabs) {
    var result = ""
    while (minSpaces--) result += " "
    return result
  } else {
    return "\t"
  }
}

export { evaluate, parse, patch, stringify }
export default { ast: parse, parse: evaluate, format: patch, stringify }
