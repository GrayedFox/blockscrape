const { client } = require('./main.js')
const api = require('./litecoin_api')
const litecoin = 'litecoin-cli'

const getBlockHashByHeight = (height) => {
  return client(litecoin, [api.getBlockHash, height])
}

const getBlock = (blockhash) => {
  return client(litecoin, [api.getBlock, blockhash])
}

const scraper = async () => {
  try {
    for (let i = 0; i < 3; i++) {
      let blockhash = await getBlockHashByHeight(i)
      let block = await getBlock(blockhash)

      console.log(block)
    }
  } catch (err) {
    console.error(err)
  }
}

scraper()
