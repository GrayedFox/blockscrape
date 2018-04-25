// blockcypher api endpoints wrapped into your friendly neighbourhood javascript
const chain = process.env.BLOCKSCRAPEAPICHAIN || 'ltc'
const url = `https://api.blockcypher.com/v1/${chain}/main`

module.exports = {
  decodeRawTransaction: `${url}/txs/decode/`,
  getBlock: `${url}/blocks/`,
  getBlockHash: `${url}/blocks/`,
  getInfo: `${url}`,
  getRawTransaction: `${url}/txs/`
}
