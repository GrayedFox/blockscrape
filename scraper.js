
const api = require('./api/api.js')

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

// will need to figure out how to write to the CSV file in order of blocks being scraped
// OR will need to sort data in csv file after, based on blockHeight OR epochtime etc
const writeToCsvFile = (stream, data) => {
  for (let i = 0; i < data.length; i++) {
    if (i < data.length - 1) {
      stream.write(`${data[i]},`)
    } else {
      stream.write(`${data[i]}\n`)
    }
  }
}

const testTransaction = async (txHash) => {
  const tx = await api.getRawTransaction(txHash)
  const fee = await calculateFee(tx)

  console.log(tx)
  console.log(txHash)
  console.log(fee)
}

const scraper = async (blockHeight, stream) => {
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

      writeToCsvFile(stream, [txAmount, fee, tx.time, tx.txid, blockHeight])
    }

    console.log(`Transactions in block: ${transactions.length}`)
    console.log(`'Block ${blockHeight} done!`)

  } catch (err) {
    console.error(err)
  }
}

module.exports = {
  testTransaction,
  scraper
}
