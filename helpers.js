const api = require('./api/api.js')
const { cache } = require('./client.js')
const { parseTransaction } = require('./parser.js')

// attempt to get a cached copy of a transaction, if this fails, parse and store the result of hitting the api
const getCachedTransaction = async (txHash) => {
  let transaction = undefined

  if (await cache(['exists', txHash])) {
    transaction = await cache(['get', txHash])
  } else {
    transaction = await api.getTransactionByHash(txHash)
    transaction = parseTransaction(transaction)
    cache(['set', txHash, transaction])
  }

  return transaction
}

// the calling context of getCachedTransction defines its cache so we must wrap it into an exposed method which has
// the 'helper' file as it's calling scope to prevent spwaning multiple caches which are not shared
const getTransaction = async (txHash) => getCachedTransaction(txHash)

// loop through the outputs of a transaction, greedily returning the value of the output whos index matches inputIndex
const getMatchingTransactionValue = async (txHash, inputIndex) => {
  const transaction = await getCachedTransaction(txHash)
  let outputs = transaction.outputs

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
    inputTotal += await getMatchingTransactionValue(tx.inputs[i].hash, tx.inputs[i].index)
  }

  return inputTotal - outputTotal
}

module.exports = {
  calculateFee,
  getTransaction,
  getTransactionTotal
}
