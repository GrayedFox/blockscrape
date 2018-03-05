
const api = require('./api/api.js')

const scraper = async (blockheight) => {
  blockheight = blockheight || 1234567

  try {
    let blockhash = await api.getBlockHashByHeight(blockheight)
    let block = await api.getBlock(blockhash)
    let blockObj = JSON.parse(block)
    let transactions = blockObj.tx

    for (let i = 0; i < transactions.length; i++) {
      let rawTx = await api.getRawTransaction(transactions[i])
      console.log(rawTx)
    }

  } catch (err) {
    console.error(err)
  }
}

scraper()
