
const api = require('./api/api.js')
const fs = require('fs')

let stream = fs.createWriteStream('./exportedData.csv')

// loop through the outputs of a tx, greedily returning the value of an output tx where n matches vOutIdx
const getMatchingTransactionValue = async (txHash, voutIndex) => {
  let tx = await api.getRawTransaction(txHash)
  let voutArray = JSON.parse(tx).vout

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

const writeToCsvFile = (data, newline) => {
  newline = newline || false
  if (newline !== true) {
    stream.write(`${data},`)
  } else {
    stream.write(`${data}\n`)
  }
}

const scraper = async (blockHeight) => {
  blockHeight = blockHeight || 1234567

  try {
    let blockHash = await api.getBlockHashByHeight(blockHeight)
    let block = await api.getBlock(blockHash)
    let transactions = JSON.parse(block).tx

    // skip the generation transaction (coinbase) when scraping
    for (let i = 1; i < transactions.length; i++) {
      let tx = await api.getRawTransaction(transactions[i])
      tx = JSON.parse(tx)

      let txAmount = sumOutputs(tx.vout)
      let fee = await calculateFee(tx, txAmount)

      writeToCsvFile(txAmount)
      writeToCsvFile(fee)
      writeToCsvFile(tx.time)
      writeToCsvFile(tx.txid)
      writeToCsvFile(blockHeight, true)
    }

    console.log(`Transactions in block: ${transactions.length}`)
    console.log(`'Block ${blockHeight} done!`)

  } catch (err) {
    console.error(err)
  }
}

const testTransaction = async (txHash) => {
  const tx = await api.getRawTransaction(txHash)
  const fee = await calculateFee(tx)

  console.log(tx)
  console.log(txHash)
  console.log(fee)
}

testTransaction('3d7bcb3f095d33723bb6566f9fcaa5cc01ba86f54cf88bf3ab86a31a2ced5539')
scraper()
