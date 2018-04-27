const { Block, Transaction, TransactionInput, TransactionOutput } = require('./classes.js')

const blockHashTokens = ['hash']
const blockHeightTokens = ['height']
const blockTimeMedianTokens = ['mediantime']
const blockTimeReceivedTokens = ['received_time']
const blockTimeTokens = ['time']
const blockTransactionTokens = ['tx', 'txids']
const blockTransactionTotalTokens = ['n_tx']

const transactionFeeTokens = ['fee', 'fees']
const transactionInputIndexTokens = ['output_index', 'vout']
const transactionInputTokens = [ 'inputs', 'vin']
const transactionInputTxidTokens = ['txid', 'prev_hash']
const transactionOutputIndexTokens = ['n']
const transactionOutputTokens = ['outputs', 'vout']
const transactionTimeConfirmedTokens = ['confirmed']
const transactionTimeReceivedTokens = ['received', 'time']
const transactionTxidTokens = ['txid', 'hash']
const transactionValueTokens = ['value', 'output_value', 'total']

const populateInputs = (transaction, inputs) => {
  for (let i = 0; i < inputs.length; i++) {
    let index = undefined
    let txid = undefined
    let value = undefined

    for (const key of Object.keys(inputs[i])) {
      if (transactionInputIndexTokens.includes(key)) {
        index = inputs[i][key]
        continue
      }

      if (transactionInputTxidTokens.includes(key)) {
        txid = inputs[i][key]
        continue
      }

      if (transactionValueTokens.includes(key)) {
        value = inputs[i][key]
        continue
      }

      if (txid && index && value) {
        break
      }
    }

    transaction.inputs.push(new TransactionInput(txid, index, value))
  }
}

const populateOutputs = (transaction, outputs) => {
  for (let i = 0; i < outputs.length; i++) {
    let index = undefined
    let value = undefined

    for (const key of Object.keys(outputs[i])) {
      if (transactionOutputIndexTokens.includes(key)) {
        index = outputs[i][key]
        continue
      }

      if (transactionValueTokens.includes(key)) {
        value = outputs[i][key]
        continue
      }

      if (index && value) {
        break
      }
    }

    transaction.outputs.push(new TransactionOutput(index, value))
  }
}

// scannerless transaction parser which checks tx attributes against matching string tokens (does not transform data)
const txParser = (rawTx) => {
  if (typeof(rawTx) === 'string') {
    rawTx = JSON.parse(rawTx)
  }

  let transaction = new Transaction()

  for (const key of Object.keys(rawTx)) {
    if (Array.isArray(rawTx[key])) {
      if (transactionInputTokens.includes(key)) {
        populateInputs(transaction, rawTx[key])
        continue
      }

      if (transactionOutputTokens.includes(key)) {
        populateOutputs(transaction, rawTx[key])
        continue
      }
    } else {
      if (transactionTxidTokens.includes(key)) {
        transaction.txid = rawTx[key]
        continue
      }

      if (transactionFeeTokens.includes(key)) {
        transaction.fee = rawTx[key]
        continue
      }

      if (transactionTimeConfirmedTokens.includes(key)) {
        transaction.timeConfirmed = rawTx[key]
        continue
      }

      if (transactionTimeReceivedTokens.includes(key)) {
        transaction.timeReceived = rawTx[key]
        continue
      }

      if (transactionValueTokens.includes(key)) {
        transaction.total = rawTx[key]
        continue
      }
    }
  }

  return transaction
}

// transform data of a given Transaction or Block to standard formats
const transformData = (object, convertToISO = true, convertToSatoshis = true) => {
  if (convertToISO) {
    object.convertTimesToISO()
  }

  if (object instanceof Transaction && convertToSatoshis) {
    object.convertValuesToSatoshis()
  }

  return object
}

// scannerless block parser which checks block attributes against matching string tokens (does not transform data)
const blockParser = (rawBlock) => {
  if (typeof(rawBlock) === 'string') {
    rawBlock = JSON.parse(rawBlock)
  }

  let block = new Block()

  for (const key of Object.keys(rawBlock)) {
    if (Array.isArray(rawBlock[key])) {
      if (blockTransactionTokens.includes(key)) {
        block.transactions = rawBlock[key]
        continue
      }
    } else {
      if (blockHashTokens.includes(key)) {
        block.hash = rawBlock[key]
        continue
      }

      if (blockHeightTokens.includes(key)) {
        block.height = rawBlock[key]
        continue
      }

      if (blockTimeTokens.includes(key)) {
        block.time = rawBlock[key]
        continue
      }

      if (blockTimeMedianTokens.includes(key)) {
        block.timeMedian = rawBlock[key]
        continue
      }

      if (blockTimeReceivedTokens.includes(key)) {
        block.timeReceived = rawBlock[key]
        continue
      }

      if (blockTransactionTotalTokens.includes(key)) {
        block.totalTransactions = rawBlock[key]
        continue
      }
    }
  }

  if (!block.totalTransactions) {
    block.totalTransactions = block.transactions.length
  }

  return block
}

module.exports = {
  blockParser,
  txParser,
  transformData
}
