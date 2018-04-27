const api = require('./api/api.js')
const { cache } = require('./client.js')
const parser = require('./parser.js')

// attempt to get a cached copy of a transaction's output array, otherwise use getRawTransaction to fetch it
const getTransactionOutputs = async (txHash) => {
  let outputs = undefined

  if (await cache(['exists', txHash])) {
    outputs = await cache(['get', txHash])
  } else {
    const rawTx = await api.getRawTransaction(txHash, [true])
    let tx = parser.txParser(rawTx)
    outputs = tx.outputs
    cache(['set', txHash, tx.outputs])
  }

  return outputs
}

// loop through the outputs of a transaction, greedily returning the value of the output whos index matches inputIndex
const getMatchingTransactionValue = async (txHash, inputIndex) => {
  let outputs = await getTransactionOutputs(txHash)

  for (let i = 0; i < outputs.length; i++) {
    if (outputs[i].index === inputIndex) {
      return outputs[i].value
    }
  }
}

const getTransactionTotal = (outputs) => {
  return outputs.reduce( (accumulator, currentValue) => accumulator + currentValue.value, 0)
}

const calculateFee = async (tx, outputTotal) => {
  let inputTotal = 0

  for (let i = 0; i < tx.inputs.length; i++) {
    inputTotal += await getMatchingTransactionValue(tx.inputs[i].txid, tx.inputs[i].index)
  }

  return inputTotal - outputTotal
}

module.exports = {
  calculateFee,
  getTransactionTotal
}
