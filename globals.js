const api = require('./api/api.js')

let transactions = {}

const storeTransaction = (tx, vout) => { transactions[tx] = vout }

const transactionExists = (tx) => transactions[tx] ? true : false

const retrieveTransaction = (tx) => transactions[tx]

const clearTransaction = (tx) => { delete transactions[tx] }

// loop through the outputs of a tx, greedily returning the value of an output tx where n matches vOutIdx
const getMatchingTransactionValue = async (txHash, voutIndex) => {
  let tx = undefined
  let voutArray = undefined

  if (transactionExists(txHash)) {
    voutArray = retrieveTransaction(txHash)
    clearTransaction(txHash)
  } else {
    tx = await api.getRawTransaction(txHash)
    voutArray = JSON.parse(tx).vout
    storeTransaction(txHash, voutArray)
  }

  for (let i = 0; i < voutArray.length; i++) {
    if (voutArray[i].n === voutIndex) {
      return voutArray[i].value
    }
  }
}

const getTransactionTotal = (voutArray) => {
  return voutArray.reduce( (accumulator, currentValue) => accumulator + currentValue.value, 0)
}

const calculateFee = async (tx, outputTotal) => {
  let inputTotal = 0

  for (let i = 0; i < tx.vin.length; i++) {
    inputTotal += await getMatchingTransactionValue(tx.vin[i].txid, tx.vin[i].vout)
  }

  return inputTotal - outputTotal
}

module.exports = {
  calculateFee,
  getTransactionTotal
}
