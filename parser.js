const { Transaction, TransactionInput, TransactionOutput } = require('./classes.js')

const feeTokens = ['fee', 'fees']
const inputTokens = [ 'inputs', 'vin']
const inputIndexTokens = ['output_index', 'vout']
const inputTxidTokens = ['txid', 'prev_hash']
const outputTokens = ['outputs', 'vout']
const outputIndexTokens = ['n']
const timeConfirmedTokens = ['confirmed']
const timeReceivedTokens = ['received', 'time']
const txidTokens = ['txid', 'hash']
const valueTokens = ['value', 'output_value', 'total']

const populateInputs = (transaction, inputs) => {
  for (let i = 0; i < inputs.length; i++) {
    let index = undefined
    let txid = undefined
    let value = undefined

    for (const key of Object.keys(inputs[i])) {
      if (inputIndexTokens.includes(key)) {
        index = inputs[i][key]
        continue
      }

      if (inputTxidTokens.includes(key)) {
        txid = inputs[i][key]
        continue
      }

      if (valueTokens.includes(key)) {
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
      if (outputIndexTokens.includes(key)) {
        index = outputs[i][key]
        continue
      }

      if (valueTokens.includes(key)) {
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

// scannerless parser which processes transaction information based on matching strings (does not transform data)
const txParser = (rawTx) => {
  if (typeof(rawTx) === 'string') {
    rawTx = JSON.parse(rawTx)
  }

  let transaction = new Transaction()

  for (const key of Object.keys(rawTx)) {
    if (Array.isArray(rawTx[key])) {
      if (inputTokens.includes(key)) {
        populateInputs(transaction, rawTx[key])
        continue
      }

      if (outputTokens.includes(key)) {
        populateOutputs(transaction, rawTx[key])
        continue
      }
    } else {
      if (txidTokens.includes(key)) {
        transaction.txid = rawTx[key]
        continue
      }

      if (feeTokens.includes(key)) {
        transaction.fee = rawTx[key]
        continue
      }

      if (timeConfirmedTokens.includes(key)) {
        transaction.timeConfirmed = rawTx[key]
        continue
      }

      if (timeReceivedTokens.includes(key)) {
        transaction.timeReceived = rawTx[key]
        continue
      }

      if (valueTokens.includes(key)) {
        transaction.total = rawTx[key]
        continue
      }
    }
  }

  return transaction
}

const txTransformer = (transaction, convertToISO = true, convertToSatoshis = false) => {
  if (convertToISO) {
    transaction.convertTimesToISO()
  }

  if (convertToSatoshis) {
    transaction.convertValuesToSatoshis()
  }

  return transaction
}

module.exports = {
  txParser,
  txTransformer
}
