const { client, blockchainCli, blockchainApi } = require('../client.js')
const litecoin = require('./litecoin.js')
const blockcypher = require('./blockcypher.js')

let api = undefined

if (blockchainCli.endsWith('litecoin-cli') || blockchainCli.endsWith('bitcoin-cli')) {
  api = litecoin
}

// if both api and cli are defined api is given preference
if (blockchainApi && blockchainApi.includes('blockcypher')) {
  api = blockcypher
}

/**
 *  This API acts as a wrapper for whatever local or remote endpoint you're querying. In order to extend it you will
 *  need to map the matching operation from the local/remote endpoint to one of the below functions. Check the
 *  blockcypher or litecoin files for examples of mapping commands to this format and make sure to extend the
 *  IF conditions above for catching and setting the correct API.
 *
 *  [shared format for all API commands: required arg, optional args]
 *  @param  {[type]} required :: normally a string (valid tx/block hash) or number -- required
 *  @param  {[array]} options :: params for the command, must be an array even if passing a single value -- optional
 *  @return {[promise]}       :: returns a promise; resolved with result of command, rejected by any error
 **/

const decodeRawTransaction = (txHash, options, method) => {
  if (api === blockcypher && typeof(method) === 'undefined') {
    method = 'POST'
  }

  return client([api.decodeRawTransaction, txHash], options, method)
}

const getBlockByHash = (blockhash, options) => {
  return client([api.getBlockByHash, blockhash], options)
}

const getBlockByHeight = (height, options) => {
  return client([api.getBlockByHeight, height], options)
}

const getBlockHashByHeight = (height, options) => {
  return client([api.getBlockHash, height], options)
}

const getInfo = (options) => {
  return client([api.getInfo], options)
}

const getRawTransaction = (txHash, options) => {
  if (api === litecoin && typeof(options) === 'undefined') {
    options = [true]
  }

  return client([api.getRawTransaction, txHash], options)
}

module.exports = {
  decodeRawTransaction,
  getBlockByHash,
  getBlockByHeight,
  getBlockHashByHeight,
  getInfo,
  getRawTransaction
}
