let transactions = {}

const storeTransaction = (tx, vout) => { transactions[tx] = vout }

const lookupTransaction = (tx) => transactions[tx] ? true : false

const getTransacton = (tx) => transactions[tx]

module.exports = {
  storeTransaction,
  getTransacton,
  lookupTransaction
}
