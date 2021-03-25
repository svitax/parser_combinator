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
    nextState,
    `choice: Unable to match with any parser at index ${parserState.index}`
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



module.exports = {
  Parser,
  str,
  sequenceOf,
  choice,
  letters,
  digits,
}