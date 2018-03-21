const api = require('./api/api.js')

// loop through the outputs of a tx, greedily returning the value of an output tx where n matches vOutIdx
const getMatchingTransactionValue = async (txHash, voutIndex) => {
  let vOutArray = await api.getRawTransactionVout(txHash)

  for (let i = 0; i < vOutArray.length; i++) {
    if (vOutArray[i].n === voutIndex) {
      return vOutArray[i].value
    }
  }
}

const getTransactionTotal = (vOutArray) => {
  return vOutArray.reduce( (accumulator, currentValue) => accumulator + currentValue.value, 0)
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
