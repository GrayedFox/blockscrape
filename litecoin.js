const { client } = require('./main.js')
const api = require('./litecoin_api')
const litecoin = 'litecoin-cli'

client(litecoin, [api.getBlock, '5007153e4c02602dd2ee1df62efc727f5d5c261a942c2f254fa89fb6e6a8f0cf'])
client(litecoin, [api.getBlockHash, 0])
