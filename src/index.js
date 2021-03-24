const str = s => targetString => {
  if (targetString.startsWith(s)) {
    // success
    return s
  }
  throw new Error(`Tried to match ${s}, but got ${targetString.slice(0, 10)}...`)

}

const run = (parser, targetString) => {
  return parser(targetString)
}

const parser = str('hello there')

console.log(
  run(parser, 'hello not correct there')
)