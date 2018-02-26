// litecoin-cli commands wrapped into your friendly neighbourhood javascript
module.exports = {
  abandonTransaction: 'abandontransaction',
  addMultiSigAddress: 'addmultisigaddress',
  addNode: 'addnode',
  addWitnessAddress: 'addwitnessaddress',
  backupWallet: 'backupwallet',
  bumpFee: 'bumpfee',
  clearBanned: 'clearbanned',
  createMultiSig: 'createmultisig',
  createRawTransaction: 'createrawtransaction',
  decodeRawTransaction: 'decoderawtransaction',
  decodeScript: 'decodescript',
  disconnectNode: 'disconnectnode',
  dumpPrivKey: 'dumpprivkey',
  dumpWallet: 'dumpwallet',
  encryptWallet: 'encryptwallet',
  estimateFee: 'estimatefee',
  estimatePriority: 'estimatepriority',
  estimateSmartFee: 'estimatesmartfee',
  estimateSmartPriority: 'estimatesmartpriority',
  fundRawTransaction: 'fundrawtransaction',
  generate: 'generate',
  generateToAddress: 'generatetoaddress',
  getAccount: 'getaccount',
  getAccountAddress: 'getaccountaddress',
  getAddedNodeInfo: 'getaddednodeinfo',
  getAddressByAccount: 'getaddressesbyaccount',
  getBalance: 'getbalance',
  getBestBlockhash: 'getbestblockhash',
  getBlock: 'getblock',
  getBlockchainInfo: 'getblockchaininfo',
  getBlockCount: 'getblockcount',
  getBlockHash: 'getblockhash',
  getBlockHeader: 'getblockheader',
  getBlockTemplate: 'getblocktemplate',
  getChainTips: 'getchaintips',
  getConnectionCount: 'getconnectioncount',
  getDifficulty: 'getdifficulty',
  getInfo: 'getinfo',
  getMemoryInfo: 'getmemoryinfo',
  getMempoolAncestors: 'getmempoolancestors',
  getMempoolDescendants: 'getmempooldescendants',
  getMempoolEntry: 'getmempoolentry',
  getMempoolInfo: 'getmempoolinfo',
  getMiningInfo: 'getmininginfo',
  getNetTotals: 'getnettotals',
  getNetworkHashPs: 'getnetworkhashps',
  getNetworkInfo: 'getnetworkinfo',
  getNewAddress: 'getnewaddress',
  getPeerInfo: 'getpeerinfo',
  getRawChangeAddress: 'getrawchangeaddress',
  getRawMempool: 'getrawmempool',
  getRawTransaction: 'getrawtransaction',
  getReceivedByAccount: 'getreceivedbyaccount',
  getReceivedByAddress: 'getreceivedbyaddress',
  getTransaction: 'gettransaction',
  getTxOut: 'gettxout',
  getTxOutProof: 'gettxoutproof',
  getTxOutInfo: 'gettxoutsetinfo',
  getUnconfirmedBalance: 'getunconfirmedbalance',
  getWalletInfo: 'getwalletinfo',
  help: 'help',
  importAddress: 'importaddress',
  importMulti: 'importmulti',
  importPrivKey: 'importprivkey',
  importPrunedFunds: 'importprunedfunds',
  importPubKey: 'importpubkey',
  importWallet: 'importwallet',
  keyPoolRefill: 'keypoolrefill',
  listAccounts: 'listaccounts',
  listAddressGroupings: 'listaddressgroupings',
  listBanned: 'listbanned',
  listLockUnspent: 'listlockunspent',
  listReceivedByAccount: 'listreceivedbyaccount',
  listReceivedByAddress: 'listreceivedbyaddress',
  listSinceBlock: 'listsinceblock',
  listTransactions: 'listtransactions',
  listUnspent: 'listunspent',
  lockUnspent: 'lockunspent',
  move: 'move',
  ping: 'ping',
  preciousBlock: 'preciousblock',
  prioritiseTransaction: 'prioritisetransaction',
  pruneBlockchain: 'pruneblockchain',
  removePrunedFunds: 'removeprunedfunds',
  sendFrom: 'sendfrom',
  sendMany: 'sendmany',
  sendRawTransaction: 'sendrawtransaction',
  sendToAddress: 'sendtoaddress',
  setAccount: 'setaccount',
  setBan: 'setban',
  setNetworkActive: 'setnetworkactive',
  setTxFee: 'settxfee',
  signMessage: 'signmessage',
  signMessageWithPrivKey: 'signmessagewithprivkey',
  signRawTransaction: 'signrawtransaction',
  stop: 'stop',
  submitLock: 'submitblock',
  validateAddress: 'validateaddress',
  verifyChain: 'verifychain',
  verifyMessage: 'verifymessage',
  verifyTxOutProof: 'verifytxoutproof'
}
