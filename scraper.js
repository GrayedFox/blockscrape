const api = require('./api/api.js')
const helpers = require('./helpers.js')
const parser = require('./parser.js')

const scraper = async (blockHeight) => {
  let blockHash = await api.getBlockHashByHeight(blockHeight)
  let rawBlock = await api.getBlockByHash(blockHash)
  let block = parser.blockParser(rawBlock)
  let blockTransactionData = []

  // skip the generation transaction (coinbase) when scraping
  for (let i = 1; i < block.transactions.length; i++) {
    let rawTx = await api.getRawTransaction(block.transactions[i])
    let tx = parser.txParser(rawTx)

    tx.total = tx.total || helpers.getTransactionTotal(tx.outputs)
    tx.fee = tx.fee || await helpers.calculateFee(tx, tx.total)

    tx = parser.transformData(tx)

    blockTransactionData.push([blockHeight, tx.total, tx.fee, tx.timeReceived, tx.hash])
  }

  return({ msg: 'blockDone', data: blockTransactionData, block: blockHeight, txTotal: block.transactions.length - 1 })
}

module.exports = {
  scraper
}
