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

const stringParser = letters.map(result => ({
  type: 'string',
  value: result
}))
const numberParser = digits.map(result => ({
  type: 'number',
  value: Number(result)
}))
const dicerollParser = sequenceOf([
  digits,
  str('d'),
  digits
]).map(([n, _, s]) => ({
  type: 'diceroll',
  value: [Number(n), Number(s)]
}))

const chainParser = sequenceOf([letters, str(':')])
  .map(results => results[0])
  .chain(type => {
    if (type === 'string') {
      return stringParser
    } else if (type === 'number') {
      return numberParser
    }
    return dicerollParser
  })

// const parser = str('hello').map(result => result.toUpperCase())

console.log(
  chainParser.run('diceroll:2d8')
)