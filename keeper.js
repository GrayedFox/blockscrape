let transactions = {}

const storeTransaction = (tx, vout) => {
  transactions[tx] = vout
  console.log(transactions[tx])
}

const lookupTransaction = (tx) => transactions[tx] ? true : false

const getTransacton = (tx) => transactions[tx].vout

module.exports = {
  storeTransaction,
  getTransacton,
  lookupTransaction
}
