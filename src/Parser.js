const updateParserState = (state, index, result) => ({
  ...state,
  index,
  result
})

const updateParserError = (state, errorMsg) => ({
  ...state,
  isError: true,
  error: errorMsg
})

const updateParserResult = (state, result) => ({
  ...state,
  result
})

class Parser {
  constructor(parserStateTransformerFn) {
    this.parserStateTransformerFn = parserStateTransformerFn
  }

  run = (targetString) => {
    const initialState = {
      targetString,
      index: 0,
      result: null,
      isError: false,
      error: null
    }
    return this.parserStateTransformerFn(initialState)
  }

  map(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState)

      if (nextState.isError) return nextState

      return updateParserResult(nextState, fn(nextState.result))
    })
  }

  chain (fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState)

      if (nextState.isError) return nextState

      const nextParser = fn(nextState.result)

      return nextParser.parserStateTransformerFn(nextState)
    })
  }

  errorMap(fn) {
    return new Parser(parserState => {
      const nextState = this.parserStateTransformerFn(parserState)

      if (!nextState.isError) return nextState

      return updateParserError(nextState, fn(nextState.error, nextState.index))
    })
  }
}

const str = s => new Parser(parserState => {
  const {
    targetString,
    index,
    isError
  } = parserState

  if (isError) {
    return parserState
  }

  const slicedTarget = targetString.slice(index)

  if (slicedTarget.length === 0) {
    return updateParserError(parserState, `str: Tried to match "${s}, but got unexpected end of input`)
  }

  if (slicedTarget.startsWith(s)) {
    return updateParserState(parserState, index+s.length, s)
  }
  return updateParserError(
    parserState,
    `Tried to match ${s}, but got ${targetString.slice(index, index+10)}`
  )
})
const atomRegex = /^[^\[\]]+/;
const atom = new Parser(parserState => {
  const {
    targetString,
    index,
    isError
  } = parserState

  if (isError) {
    return parserState
  }

  const slicedTarget = targetString.slice(index)

  if (slicedTarget.length === 0) {
    return updateParserError(parserState, `atom: got unexpected end of input.`)
  }

  const regexMatch = slicedTarget.match(atomRegex)

  if (regexMatch) {
    return updateParserState(parserState, index+regexMatch[0].length, regexMatch[0])
  }

  return updateParserError(
    parserState,
    `atom: Couldn't match atom at index ${index}`
  )
})

const wordRegex = /^\w+/
const word = new Parser(parserState => {
  const {
    targetString,
    index,
    isError
  } = parserState

  if (isError) {
    return parserState
  }

  const slicedTarget = targetString.slice(index)

  if (slicedTarget.length === 0) {
    return updateParserError(parserState, `word: got unexpected end of input.`)
  }

  const regexMatch = slicedTarget.match(wordRegex)

  if (regexMatch) {
    return updateParserState(parserState, index+regexMatch[0].length, regexMatch[0])
  }

  return updateParserError(
    parserState,
    `word: Couldn't match word at index ${index}`
  )
})

const lettersRegex = /^[A-Za-z]+/;
const letters = new Parser(parserState => {
  const {
    targetString,
    index,
    isError
  } = parserState

  if (isError) {
    return parserState
  }

  const slicedTarget = targetString.slice(index)

  if (slicedTarget.length === 0) {
    return updateParserError(parserState, `letters: got unexpected end of input.`)
  }

  const regexMatch = slicedTarget.match(lettersRegex)

  if (regexMatch) {
    return updateParserState(parserState, index+regexMatch[0].length, regexMatch[0])
  }

  return updateParserError(
    parserState,
    `letters: Couldn't match letters at index ${index}`
  )
})

const digitsRegex = /^[0-9]+/;
const digits = new Parser(parserState => {
  const {
    targetString,
    index,
    isError
  } = parserState

  if (isError) {
    return parserState
  }

  const slicedTarget = targetString.slice(index)

  if (slicedTarget.length === 0) {
    return updateParserError(parserState, `digts: got unexpected end of input.`)
  }

  const regexMatch = slicedTarget.match(digitsRegex)

  if (regexMatch) {
    return updateParserState(parserState, index+regexMatch[0].length, regexMatch[0])
  }

  return updateParserError(
    parserState,
    `digits: Couldn't match digits at index ${index}`
  )
})

const sequenceOf = parsers => new Parser(parserState => {
  if (parserState.isError) {
    return parserState
  }

  const results = []
  let nextState = parserState

  for (let p of parsers) {
    nextState = p.parserStateTransformerFn(nextState)
    results.push(nextState.result)
  }

  if (nextState.isError) {
    return nextState
  }

  return updateParserResult(nextState, results)
})

const choice = parsers => new Parser(parserState => {
  if (parserState.isError) {
    return parserState
  }

  for (let p of parsers) {
    const nextState = p.parserStateTransformerFn(parserState)
    if (!nextState.isError) {
      return nextState
    }
  }

  return updateParserError(
    parserState,
    `choice: Unable to match with any parser at index ${parserState.index}`
  )
})

const many = parser => new Parser(parserState => {
  if (parserState.isError) {
    return parserState
  }

  let nextState = parserState
  const results = []
  let done = false

  while (!done) {
    let testState = parser.parserStateTransformerFn(nextState)
    if (!testState.isError) {
      results.push(testState.result)
      nextState = testState
    } else {
      done = true
    }
  }

  return updateParserResult(nextState,results)
})

const many1 = parser => new Parser(parserState => {
  if (parserState.isError) {
    return parserState
  }

  let nextState = parserState
  const results = []
  let done = false

  while (!done) {
    const nextState = parser.parserStateTransformerFn(nextState)
    if (!nextState.isError) {
      results.push(nextState.result)
    } else {
      done = true
    }
  }
  if (results.length === 0)  {
    return updateParserError(
      parserState,
      `many1: unable to match any input using parser @ index ${parserState.index}`
    )
  }

  return updateParserResult(nextState,results)
})

const between = (leftParser, rightParser) => contentParser => sequenceOf([
  leftParser,
  contentParser,
  rightParser
]).map(results => results[1])

const sepBy = seperatorParser => valueParser => new Parser(parseState => {
  if (parseState.isError) {
    return parserState
  }

  const results = []
  let nextState = parseState

  while (true) {
    const thingWeWantState = valueParser.parserStateTransformerFn(nextState)
    if (thingWeWantState.isError) {
      break
    }
    results.push(thingWeWantState.result)
    nextState = thingWeWantState

    const seperatorState = seperatorParser.parserStateTransformerFn(nextState)
    if (seperatorState.isError) {
      break
    }
    nextState = seperatorState
  }
  return updateParserResult(nextState, results)
})

const sepBy1 = seperatorParser => valueParser => new Parser(parseState => {
  if (parseState.isError) {
    return parseState
  }

  const results = []
  let nextState = parseState

  while (true) {
    const thingWeWantState = valueParser.parserStateTransformerFn(nextState)
    if (thingWeWantState.isError) {
      break
    }
    results.push(thingWeWantState.result)
    nextState = thingWeWantState

    const seperatorState = seperatorParser.parserStateTransformerFn(nextState)
    if (seperatorState.isError) {
      break
    }
    nextState = seperatorState
  }
  if (results.length === 0) {
    return updateParserError(
      parseState,
      `sepBy1: Unable to capture any results at index ${parserState.index}`
    )
  }
  return updateParserResult(nextState, results)
})

const recursive = parserThunk => new Parser(parserState => {
  const parser = parserThunk()
  return parser.parserStateTransformerFn(parserState)
})

const betweenSquareBrackets = between(str('['), str(']'))
const atomParser = atom.map(x => ({
  type: 'atom',
  value: x
}))

/**
 * Creates a parser that parses a tree according to the production rules in grammar, using
 * the utility functions from our parser combinator library
 *
 * @param    {Grammar} grammar - A Grammar object
 * @returns  {Parser}          - A Parser object that parses a tree according to the rules in grammar
 */
const createTreeParser = grammar => {
  /**
   * Each key in the parsers object represents the LHS of a production rule.
   * The value is a parser for all the possible choices of RHS for a production.
   */
  let parsers = {
    'atom': [atomParser],
  }

  /**
   * Creates a parser according to the rule encoded in a ParserRule object
   *
   * @param    {ParserRule} rule - A ParserRule object from a Grammar object
   * @returns  {Parser}          - A parser that parses a string according to the rule encoded in ParserRule
   */
  const createRule = rule => {
      /**
       * Each list in rule.symbols represents a choice of a production
       * We need to make each list into a parser so we can feed it to our
       * choice parser
       */
      const choices = getProductionChoices(rule.symbols)
      return betweenSquareBrackets(sequenceOf([
        str(rule.name),
        str(' '),
        choice(choices),
      ])).map(results => ({
        type: rule.name,
        value: results[2]
      }))
  }

  const getProductionChoices = productions => {
    let choices = []
    for (let production of productions) {
      let parsersList = []

      for (let k of production) {
        parsersList.push(parsers[k])
      }

      choices.push(sequenceOf(parsersList.flat()))
    }
    return choices
  }

  const hasValidSymbols = rule => {
    for (let sym of rule.symbols) {
      for (let s of sym) {
        if (!parsers[s]) {
          return false
        }
      }
    }
    return true
  }

  /**
   * For every rule in a grammar, we check if we have a parser for every symbol in its production
   *
   * If so, we create a parser for that rule and add it to our parsers object
   */
  for (let r of grammar.ParserRules) {
    if (hasValidSymbols(r)) {
      parsers[r.name] = [createRule(r)]
    }
  }
  return parsers[grammar.ParserStart][0]
}

/**
 * Creates an array of ParserRule objects from a grammarString, then packages that array up
 * in an object with the starting nonterminal of the grammar and returns it.
 *
 * @param {String}    grammarString - A string of dot-separated production rules in a modified EBNF form
 * @param {String}    start         - The non-terminal a parser should start at
 * @returns {Grammar}               - An object with an array of ParserRules objects and the start
 */
const createGrammar = grammarString => start => {
  /**
   * A 'production rule' is a string composed of a nonterminal (which must not contain any spaces), followed
   * by an arrow '->', followed by a production
   *
   * A 'production' is a list of symbols on the right hand side of a production rule
   * Symbols in the same production rule are separated by a space
   *
   * (S -> NP VP)
   * In the production rule above, the production would be [NP, VP]
   *
   * A nonterminal can have multiple productions, indicated by separating them with a vertical bar '|'
   * (S -> NP VP | TP)
   * In the production rule above, the productions would be [[NP, VP], [TP]]
   *
   * Each production rule is separated by a dot
   * (V -> atom . N -> atom . NP -> N . VP -> V . S -> NP VP | VP)
   *
   * 'atom' is the terminal representing any word or sentence which should be treated as one unit
   *
   * A grammarString should start with all the production rules which produce a terminal, followed by
   * the production rules which produce nonterminals we have already defined
   */

  const spaceSeparated = sepBy(str(' '))
  const barSeparated = sepBy(str('| '))
  const dotSeparated = sepBy(str('. '))

  const productionParser = barSeparated(spaceSeparated(word))
  const ruleParser = sequenceOf([
    word,
    str(' '),
    str('-> '),
    productionParser
  ])
  .map(results => ({
    name: results[0],
    symbols: results[3]
  }))
  const grammarParser = dotSeparated(ruleParser)
  const grammarRules = grammarParser.run(grammarString)

  return {
    ParserRules: grammarRules.result,
    ParserStart: start
  }
}

module.exports = {
  Parser,
  str,
  letters,
  digits,
  atom,
  word,
  sequenceOf,
  choice,
  many,
  many1,
  between,
  sepBy,
  sepBy1,
  recursive,
  createTreeParser,
  createGrammar
}