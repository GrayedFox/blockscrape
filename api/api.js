const { client, blockchainCli, blockchainApi } = require('../client.js')
const litecoin = require('./litecoin.js')
const blockcypher = require('./blockcypher.js')

let api = undefined

if (blockchainCli.endsWith('litecoin-cli') || blockchainCli.endsWith('bitcoin-cli')) {
  api = litecoin
}

// if both api and cli are defined api is given preference
if (blockchainApi === 'blockcypher') {
  api = blockcypher
}

/**
 *  This API acts as a wrapper for whatever local or remote endpoint you're querying. In order to extend it you will
 *  need to map the matching operation from the local/remote endpoint to one of the below functions. Check the
 *  blockcypher or litecoin files for examples of mapping commands to this format and make sure to extend the
 *  IF conditions above for catching and setting the correct API.
 *
 *  [shared format for all API commands]
 *  @param  {[type]} required :: normally a string (valid tx/block hash) or number; this argument is always required
 *  @param  {[array]} options :: optional params for the command, must be an array even if passing a single value
 *  @return {[promise]}       :: returns a promise; resolved with result of command, rejected by any error
 */

const decodeRawTransaction = (txHash, options) => {
  return client([api.decodeRawTransaction, txHash], options)
}

const getBlockByHash = (blockhash, options) => {
  return client([api.getBlockByHash, blockhash], options)
}

const getBlockHashByHeight = (height, options) => {
  return client([api.getBlockHash, height], options)
}

const getInfo = (options) => {
  return client([api.getInfo], options)
}

const getRawTransaction = (txHash, options) => {
  return client([api.getRawTransaction, txHash], options)
}

module.exports = {
  decodeRawTransaction,
  getBlockByHash,
  getBlockHashByHeight,
  getInfo,
  getRawTransaction
}
