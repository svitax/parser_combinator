const {
  Parser,
  str,
  sequenceOf,
} = require('./Parser.js')

// parser = ParserState in -> ParserState out

// const parser = new Parser()
const parser = str('hello').map(result => ({
  value: result.toUpperCase()
}))
.errorMap((msg, index) => `Expected a greeting @ index ${index}`)

// const parser = str('hello').map(result => result.toUpperCase())

console.log(
  parser.run('goodbye')
)