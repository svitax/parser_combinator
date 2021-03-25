const {
  Parser,
  str,
  sequenceOf,
  choice,
  many,
  letters,
  digits
} = require('./Parser.js')

// parser = ParserState in -> ParserState out

const parser = str('hello').map(result => ({
  value: result.toUpperCase()
}))
.errorMap((msg, index) => `Expected a greeting @ index ${index}`)

const digitsLettersDigitsParser = sequenceOf([
  digits,
  letters,
  digits
])

const choiceParser = choice([
  digits,
  letters
])

const manyChoiceParser = many(choice([
  digits,
  letters
])).map(results => [...results].reverse())

// const parser = str('hello').map(result => result.toUpperCase())

console.log(
  manyChoiceParser.run('50987234lakhadsg')
)