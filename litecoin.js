const { client } = require('./main.js')
const api = require('./litecoin_api')
const litecoin = 'litecoin-cli'

const getBlockHashByHeight = async (height) => {
  return await client(litecoin, [api.getBlockHash, height])
}

const getBlock = async (blockhash) => {
  return await client(litecoin, [api.getBlock, blockhash])
}

const scraper = async () => {
  for (let i = 0; i < 10; i++) {
    let blockhash = getBlockHashByHeight(i)
    let block = getBlock(blockhash)
  }
}

 scraper()
