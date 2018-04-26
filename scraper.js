const api = require('./api/api.js')
const helpers = require('./helpers.js')

const scraper = async (blockHeight) => {
  let blockHash = await api.getBlockHashByHeight(blockHeight)
  let block = await api.getBlock(blockHash)
  let transactions = JSON.parse(block).tx
  let blockTransactionData = []

  // skip the generation transaction (coinbase) when scraping
  for (let i = 1; i < transactions.length; i++) {
    let tx = await api.getRawTransaction(transactions[i])
    tx = JSON.parse(tx)

    let txAmount = helpers.getTransactionTotal(tx.vout)
    let fee = await helpers.calculateFee(tx, txAmount)
    let txTime = new Date(tx.time * 1000)

    blockTransactionData.push([blockHeight, txAmount, fee, txTime, tx.txid])
  }

  return({ msg: 'blockDone', data: blockTransactionData, block: blockHeight, txTotal: transactions.length - 1 })
}

module.exports = {
  scraper
}
