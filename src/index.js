const {
  Parser,
  str,
  sequenceOf,
  letters,
  digits
} = require('./Parser.js')

// parser = ParserState in -> ParserState out

// const parser = new Parser()
const parser = str('hello').map(result => ({
  value: result.toUpperCase()
}))
.errorMap((msg, index) => `Expected a greeting @ index ${index}`)

const digitsLettersDigitsParser = sequenceOf([
  digits,
  letters,
  digits
])

// const parser = str('hello').map(result => result.toUpperCase())

console.log(
  digitsLettersDigitsParser.run('092735hello019735')
)