const { client } = require('./main.js')
const api = require('./litecoin_api')
const litecoin = 'litecoin-cli'

const getBlockHashByHeight = (height) => {
  return client(litecoin, [api.getBlockHash, height])
}

const getBlock = (blockhash) => {
  return client(litecoin, [api.getBlock, blockhash])
}

const getTransaction = (txHash) => {
  return client(litecoin, [api.getTransaction, txHash])
}

const getRawTransaction = (txHash) => {
  return client(litecoin, [api.getRawTransaction, txHash])
}

const decodeRawTransaction = (txHash) => {
  return client(litecoin, [api.decodeRawTransaction, txHash])
}

const scraper = async (nextBlock) => {
  nextBlock = nextBlock || 1234567
  try {
    let blockhash = await getBlockHashByHeight(nextBlock)
    let block = await getBlock(blockhash)
    let blockObj = JSON.parse(block)
    let transactions = blockObj.tx

    for (let i = 0; i < transactions.length; i++) {
      let rawTx = await getRawTransaction(transactions[i])
      console.log(await (decodeRawTransaction(rawTx)))
    }

  } catch (err) {
    console.error(err)
  }
}

scraper()
