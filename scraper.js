
const api = require('./api/api.js')

const getTransactionValue = async (txHash, vOutIndex) => {
  let tx = await api.getRawTransaction(txHash)
  let valueOuts = JSON.parse(tx).vout

  for (let i = 0; i < valueOuts.length; i++) {
    if (valueOuts[i].n === vOutIndex) {
      return valueOuts[i].value
    }
  }
}

const calculateFees = async (txVinArray) => {
  txVinArray = txVinArray || mock
  let fee = 0

  for (let i = 0; i < txVinArray.length; i++) {
    let value = getTransactionValue(txVinArray[i].txid, txVinArray[i].vout)
  }
}

const scraper = async (blockheight) => {
  blockheight = blockheight || 1234568

  try {
    let blockhash = await api.getBlockHashByHeight(blockheight)
    let block = await api.getBlock(blockhash)
    let blockObj = JSON.parse(block)
    let transactions = blockObj.tx

    for (let i = 0; i < transactions.length; i++) {
      let rawTx = await api.getRawTransaction(transactions[i])
      console.log(rawTx)
    }

    console.log('NEXT BLOCK')

  } catch (err) {
    console.error(err)
  }
}

scraper()
