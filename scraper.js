const api = require('./api/api.js')
const { storeTransaction, getTransacton, lookupTransaction } = require('./keeper.js')

// loop through the outputs of a tx, greedily returning the value of an output tx where n matches vOutIdx
const getMatchingTransactionValue = async (txHash, voutIndex) => {
  let tx = undefined
  let voutArray = undefined

  if (lookupTransaction(txHash)) {
    console.log(`Transaction ${txHash} found! Moimoi bitches!`)
    voutArray = getTransacton(txHash)
  } else {
    tx = await api.getRawTransaction(txHash)
    voutArray = JSON.parse(tx).vout
    storeTransaction(tx, voutArray)
  }

  for (let i = 0; i < voutArray.length; i++) {
    if (voutArray[i].n === voutIndex) {
      return voutArray[i].value
    }
  }
}

const sumOutputs = (voutArray) => {
  return voutArray.reduce( (accumulator, currentValue) => accumulator + currentValue.value, 0)
}

const calculateFee = async (tx, outputTotal) => {
  let inputTotal = 0

  for (let i = 0; i < tx.vin.length; i++) {
    inputTotal += await getMatchingTransactionValue(tx.vin[i].txid, tx.vin[i].vout)
  }

  return inputTotal - outputTotal
}

const scraper = async (blockHeight) => {
  let blockHash = await api.getBlockHashByHeight(blockHeight)
  let block = await api.getBlock(blockHash)
  let transactions = JSON.parse(block).tx
  let blockTransactionData = []

  // skip the generation transaction (coinbase) when scraping
  for (let i = 1; i < transactions.length; i++) {
    let tx = await api.getRawTransaction(transactions[i])
    tx = JSON.parse(tx)

    let txAmount = sumOutputs(tx.vout)
    let fee = await calculateFee(tx, txAmount)

    blockTransactionData.push([blockHeight, txAmount, fee, tx.time, tx.txid])
  }

  console.log(`Block ${blockHeight} done!`)

  return({ msg: 'blockDone', data: blockTransactionData, block: blockHeight })
}

const testTransaction = async (txHash) => {
  const tx = await api.getRawTransaction(txHash)
  const fee = await calculateFee(tx)

  console.log(tx)
  console.log(txHash)
  console.log(fee)
}

module.exports = {
  testTransaction,
  scraper
}
