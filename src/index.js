const {
  Parser,
  str,
  letters,
  digits,
  sequenceOf,
  choice,
  many,
  between,
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

const betweenBrackets = between(str('('), str(')'))
const betweenParser = betweenBrackets(letters)

// const parser = str('hello').map(result => result.toUpperCase())

console.log(
  betweenParser.run('(loalkdhags)')
)