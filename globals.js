const api = require('./api/api.js')

let transactions = new Map()

// loop through the outputs of a tx, greedily returning the value of an output tx where n matches vOutIdx
const getMatchingTransactionValue = async (txHash, voutIndex) => {
  let tx = undefined
  let voutArray = undefined

  if (transactions.has(txHash)) {
    voutArray = transactions.get(txHash)
  } else {
    tx = await api.getRawTransaction(txHash)
    voutArray = JSON.parse(tx).vout
    transactions.set(txHash, voutArray)
  }

  if (transactions.size > 5000) {
    console.warn('Memoized transactions over five thousand!!!!!!!!!')
    transactions.clear()
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
