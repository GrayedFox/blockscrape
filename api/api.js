const { client, blockchainCli, blockchainApi, blockchainApiToken } = require('../client.js')
const litecoin = require('./litecoin.js')
const blockcypher = require('./blockcypher.js')

let blockchain = undefined
let args = { method: 'GET', port: 443, strictSSL: true }
let defaultParams = []

if (blockchainCli.endsWith('litecoin-cli') || blockchainCli.endsWith('bitcoin-cli')) {
  blockchain = litecoin
}

// if both api (remote) and cli (local) are defined remote endpoint is given preference
if (blockchainApi && blockchainApi.includes('blockcypher')) {
  blockchain = blockcypher
  // NOTE blockcypher refuses to return data, waiting on response from their team,
  // see: https://github.com/blockcypher/node-client/issues/25
  if (blockchainApiToken) {
    defaultParams.push(`token=${blockchainApiToken}`)
  }
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

function setDefaults(params) {
  if (typeof(params) !== 'undefined') {
    return [...params, ...defaultParams]
  }

  if (defaultParams.length > 0) {
    return [...defaultParams]
  }
}

const decodeRawTransaction = (txHash, params) => {
  if (blockchain === blockcypher) {
    args.method = 'POST' // NOTE figure out design pattern to move all conditionals outside of these core api functions
  }

  params = setDefaults(params)
  return client([blockchain.decodeRawTransaction, txHash], params, args)
}

const getBlockByHash = (blockhash, params) => {
  params = setDefaults(params)
  return client([blockchain.getBlockByHash, blockhash], params, args)
}

const getBlockByHeight = (height, params) => {
  params = setDefaults(params)
  return client([blockchain.getBlockByHeight, height], params, args)
}

const getBlockHashByHeight = (height, params) => {
  params = setDefaults(params)
  return client([blockchain.getBlockHash, height], params, args)
}

const getInfo = (params) => {
  params = setDefaults(params)
  return client([blockchain.getInfo], params, args)
}

const getTransactionByHash = (txHash, params) => {
  if (blockchain === litecoin && typeof(params) === 'undefined') {
    params = [true] // see above note
  }
  params = setDefaults(params)
  return client([blockchain.getTransactionByHash, txHash], params, args)
}

module.exports = {
  decodeRawTransaction,
  getBlockByHash,
  getBlockByHeight,
  getBlockHashByHeight,
  getInfo,
  getTransactionByHash
}
