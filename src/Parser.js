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

  // letters.chain(result => {})
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

const createTreeParser = grammar => {
  let parsers = {
    'atom': [atomParser],
  }
  function createRule (rule) {
      // const productionParser = p.ParserRules.find(x => Object.keys(x) === rule.symbols)
      // const productions = p.ParserRules.find(x => Object.keys(x)[0] === rule.symbols[0])
      let choices = []
      for (let s of rule.symbols) {
        let a = queryParsers(s)
        choices.push(sequenceOf(queryParsers(s)))
      }

      return betweenSquareBrackets(sequenceOf([
        str(rule.name),
        str(' '),
        choice(choices),
      ])).map(results => ({
        type: rule.name,
        value: results[2]
      }))
  }

  function queryParsers (keys) {
    let parsersList = []
    for (let k of keys) {
      parsersList.push(parsers[k])
    }
    return parsersList.flat()
  }

  function hasValidSymbols (rule) {
    for (let sym of rule.symbols) {
      for (let s of sym) {
        if (!parsers[s]) {
          return false
        }
      }
      // if (!p.ParserRules.find(x => x[sym])) {
        // return false
      // }
    }
    return true
  }

  for (let r of grammar.ParserRules) {
    // check that we have a parser for all the symbols in our rule r
    // if (p.ParserRules.find(x => x[r.symbols]))
    if (hasValidSymbols(r)) {
      // p.ParserRules.push({[Object.keys(r)[0]]: createRule(r)})
      // p.ParserRules.push({[r['name']]: createRule(r)})
      parsers[r.name] = [createRule(r)]
    }
  }

  // return parsers[grammar.ParserStart]
  // const start = p.ParserRules.find(x => Object.keys(x)[0] === grammar.ParserStart)
  // return start[Object.keys(start)[0]]

  return parsers[grammar.ParserStart][0]
}

// todo: createGrammar function

module.exports = {
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
}