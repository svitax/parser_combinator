const {
  Parser,
  str,
  sequenceOf,
  letters
} = require('./Parser.js')

// parser = ParserState in -> ParserState out

// const parser = new Parser()
const parser = str('hello').map(result => ({
  value: result.toUpperCase()
}))
.errorMap((msg, index) => `Expected a greeting @ index ${index}`)

const lettersParser = letters

// const parser = str('hello').map(result => result.toUpperCase())

console.log(
  lettersParser.run('haldkhg097345')
)