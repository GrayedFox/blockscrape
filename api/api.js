const { client, blockchainCli } = require('../client.js')
const litecoin = require('./litecoin-api')

let blockchain = undefined

if (blockchainCli.endsWith('litecoin-cli') || blockchainCli.endsWith('bitcoin-cli')) {
  blockchain = litecoin
}

const decodeRawTransaction = (txHash) => {
  return client([blockchain.decodeRawTransaction, txHash])
}

const getBlock = (blockhash) => {
  return client([blockchain.getBlock, blockhash])
}

const getBlockHashByHeight = (height) => {
  return client([blockchain.getBlockHash, height])
}

const getInfo = () => {
  return client([blockchain.getInfo])
}

const getRawTransaction = (txHash, verbose = true) => {
  return client([blockchain.getRawTransaction, txHash, verbose])
}

module.exports = {
  decodeRawTransaction,
  getBlock,
  getBlockHashByHeight,
  getInfo,
  getRawTransaction
}
