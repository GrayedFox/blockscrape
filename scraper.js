const api = require('./api/api.js')
const globals = require('./globals.js')

const scraper = async (blockHeight) => {
  let blockHash = await api.getBlockHashByHeight(blockHeight)
  let block = await api.getBlock(blockHash)
  let transactions = JSON.parse(block).tx
  let blockTransactionData = []

  // skip the generation transaction (coinbase) when scraping
  for (let i = 1; i < transactions.length; i++) {
    let tx = await api.getRawTransaction(transactions[i])
    tx = JSON.parse(tx)

    let txAmount = globals.getTransactionTotal(tx.vout)
    let fee = await globals.calculateFee(tx, txAmount)

    blockTransactionData.push([blockHeight, txAmount, fee, tx.time, tx.txid])
  }

  console.log(`Block ${blockHeight} done after processing ${transactions.length - 1} transactions!`)

  return({ msg: 'blockDone', data: blockTransactionData, block: blockHeight, txTotal: transactions.length - 1 })
}

module.exports = {
  scraper
}
