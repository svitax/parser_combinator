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

// parser = ParserState in -> ParserState out

const run = (parser, targetString) => {
  const initialState = {
    targetString,
    index: 0,
    result: null
  }
  return parser(initialState)
}

const parser = str('hello there!')

console.log(
  run(parser, 'hello there!')
)