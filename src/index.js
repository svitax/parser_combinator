const {
  Parser,
  str,
  letters,
  digits,
  sequenceOf,
  choice,
  many,
  many1,
  between,
  sepBy,
  sepBy1,
  recursive,
  createTreeParser,
  atomParser,
  digitsParser
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

const betweenSquareBrackets = between(str('['), str(']'))
const commaSeparated = sepBy(str(','))

const value = recursive(() => choice([
  digits,
  arrayParser
]))

const arrayParser = betweenSquareBrackets(commaSeparated(value))
// const parser = str('hello').map(result => result.toUpperCase())

const grammar = {
  ParserRules: [
    // terminals should go first
    // and working our way up
    {name: 'N', symbols: [['atom', 'digits'], ['atom']]},
    {name: 'V', symbols: [['atom']]},
    {name: 'NP', symbols: [['N', 'V']]},
  ],
  ParserStart: 'NP'
}

const treeParser = createTreeParser(grammar)
result = treeParser.run('[NP [N ahah][V b]]')
console.log(JSON.stringify(result, null, ' '))