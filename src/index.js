const {
  createGrammar,
  createTreeParser,
} = require('./Parser.js')

const grammarString1 = 'N -> atom . V -> atom . VP -> V . NP -> N . S -> NP VP | NP'
const grammar1 = createGrammar(grammarString1)('S')
const treeParser1 = createTreeParser(grammar1)
const result1 = treeParser1.run('[S [NP [N King Robot 4]][VP [V ran]]]')
console.log(JSON.stringify(result1.result, null, ' '))

const grammarString2 = 'V -> atom . NP -> atom . PP -> atom . Vb -> PP | V NP . VP -> Vb'
const grammar2 = createGrammar(grammarString2)('VP')
const treeParser2 = createTreeParser(grammar2)
let result2 = treeParser2.run('[VP [Vb [PP quickly]]]')
console.log(JSON.stringify(result2.result, null, ' '))
result2 = treeParser2.run('[VP [Vb [V killed][NP John]]]')
console.log(JSON.stringify(result2.result, null, ' '))