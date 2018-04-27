const api = require('./api/api.js')
const helpers = require('./helpers.js')
const parser = require('./parser.js')

const scraper = async (blockHeight) => {
  let blockHash = await api.getBlockHashByHeight(blockHeight)
  let block = await api.getBlockByHash(blockHash)
  let transactions = JSON.parse(block).tx
  let blockTransactionData = []

  // skip the generation transaction (coinbase) when scraping
  for (let i = 1; i < transactions.length; i++) {
    let rawTx = await api.getRawTransaction(transactions[i])
    let tx = parser.txParser(rawTx)

    tx.total = tx.total || helpers.getTransactionTotal(tx.outputs)
    tx.fee = tx.fee || await helpers.calculateFee(tx, tx.total)

    // tx = parser.txTransformer(tx, true, true)

    blockTransactionData.push([blockHeight, tx.total, tx.fee, tx.timeReceived, tx.txid])
  }

  return({ msg: 'blockDone', data: blockTransactionData, block: blockHeight, txTotal: transactions.length - 1 })
}

module.exports = {
  scraper
}
