const blockchain = process.env.BLOCKSCRAPEAPICHAIN || 'ltc'
const url = `https://api.blockcypher.com/v1/${blockchain}/main`

// blockcypher api endpoints wrapped into your friendly neighbourhood javascript
module.exports = {
  decodeRawTransaction:`${url}/txs/decode/`,
  getBlockByHash: `${url}/blocks/'`,
  getBlockHash: `${url}/blocks/`,
  getInfo: `${url}/`,
  getRawTransaction: `${url}/txs/`
}
