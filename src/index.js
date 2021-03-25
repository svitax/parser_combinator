const str = s => parserState => {
  const {
    targetString,
    index
  } = parserState


  if (targetString.slice(index).startsWith(s)) {
    // success
    return {
      ...parserState,
      result: s,
      index: index + s.length
    }
  }
  throw new Error(`Tried to match ${s}, but got ${targetString.slice(index, index+10)}...`)
}

const sequenceOf = parsers => parserState => {
  const results = []
  let nextState = parserState

  for (let p of parsers) {
    nextState = p(nextState)
    results.push(nextState.result)
  }

  return {
    ...nextState,
    result: results
  }
}

// parser = ParserState in -> ParserState out

const run = (parser, targetString) => {
  const initialState = {
    targetString,
    index: 0,
    result: null
  }
  return parser(initialState)
}

const parser = sequenceOf ([
  str('hello there!'),
  str('goodbye there!')
])

console.log(
  run(parser, 'hello there!goodbye there!')
)