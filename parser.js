const { Transaction, InputTransaction, OutputTransaction } = require('./classes.js')

const fee = ['fee', 'fees']
const inputs = [ 'inputs', 'vin']
const inputsIndex = ['output_index', 'vout']
const inputsTxid = ['txid', 'prev_hash']
const outputs = ['outputs', 'vout']
const outputsIndex = ['n']
const timeConfirmed = ['confirmed']
const timeReceived = ['received', 'time']
const txid = ['txid', 'hash']
const value = ['value', 'output_value']

const populateInputs = (tx, inputs) => {
  for (let i = 0; i < inputs.length; i++) {
    let index = undefined
    let txid = undefined
    let value = undefined

    for (const key of Object.keys(inputs[i])) {
      if (inputsIndex.contains(key)) {
        index = inputs[i][key]
        continue
      }

      if (inputsTxid.contains(key)) {
        txid = inputs[i][key]
        continue
      }

      if (value.contains(key)) {
        value = inputs[i][key]
        continue
      }

      if (txid && index && value) {
        break
      }
    }

    tx.inputs.push(new InputTransaction(txid, index, value))
  }
}

const populateOutputs = (tx, outputs) => {
  for (let i = 0; i < outputs.length; i++) {
    let index = undefined
    let value = undefined

    for (const key of Object.keys(outputs[i])) {
      if (outputsIndex.contains(key)) {
        index = outputs[i][key]
        continue
      }

      if (value.contains(key)) {
        value = outputs[i][key]
        continue
      }

      if (index && value) {
        break
      }
    }

    tx.outputs.push(new OutputTransaction(index, value))
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
      if (inputs.includes(key)) {
        populateInputs(transaction, rawTx[key])
        continue
      }

      if (outputs.includes(key)) {
        populateOutputs(transaction, rawTx[key])
        continue
      }
    } else {
      if (txid.includes(key)) {
        transaction.txid = rawTx[key]
        continue
      }

      if (fee.includes(key)) {
        transaction.fee = rawTx[key]
        continue
      }

      if (timeConfirmed.includes(key)) {
        transaction.timeConfirmed = rawTx[key]
        continue
      }

      if (timeReceived.includes(key)) {
        transaction.timeReceived = rawTx[key]
        continue
      }

      if (value.includes(key)) {
        transaction.value = rawTx[key]
        continue
      }
    }
  }

  return transaction
}

const txTransformer = (formattedTx, convertToISO = true, convertToSatoshis = false) => {
  if (convertToISO) {
    formattedTx.convertTimesToISO()
  }

  if (convertToSatoshis) {
    formattedTx.convertValuesToSatoshis()
  }
}

module.exports = {
  txParser,
  txTransformer
}
