// recursive function to convert value(s) to Sathoshi; !NOTE! assumes standard ratio of 1:100,000,000
const convertToSatoshis = (values) => {
  if (Array.isArray(values)) {
    for (let i = 0; i < values.length; i++) {
      values[i].value = convertToSatoshis(values[i].value)
    }
  } else {
    return Math.round(1e8 * values)
  }
  return values
}

// converts a given epochTime to standard ISO date string - if epochTime is not a number do not attempt transform
const convertEpochToIso = (epochTime) => {
  if (typeof(epochTime) !== 'number') {
    return epochTime
  } else {
    let date = new Date(epochTime * 1000)
    return date.toISOString()
  }
}

class Block {
  constructor() {
    this.hash = '',
    this.height = '',
    this.time = undefined,
    this.timeMedian = undefined,
    this.timeReceived = undefined,
    this.transactions = []
    this.totalTransactions = undefined
  }

  convertEpochToIso() {
    this.time = convertEpochToIso(this.time)
    this.timeMediam = convertEpochToIso(this.timeMedian)
    this.timeReceived = convertEpochToIso(this.timeReceived)
  }
}

class Transaction {
  constructor() {
    this.txid = '',
    this.total = undefined,
    this.fee = undefined,
    this.timeConfirmed = undefined,
    this.timeReceived = undefined,
    this.inputs = [],
    this.outputs = []
  }

  convertValuesToSatoshis() {
    this.total = convertToSatoshis(this.total)
    this.fee = convertToSatoshis(this.fee)
    this.outputs = convertToSatoshis(this.outputs)
  }

  convertTimesToISO() {
    this.timeConfirmed = convertEpochToIso(this.timeConfirmed)
    this.timeReceived = convertEpochToIso(this.timeReceived)
  }
}

class TransactionInput {
  constructor(txid, inputIndex, value) {
    this.txid = txid,
    this.index = inputIndex,
    this.value = value
  }
}

class TransactionOutput {
  constructor(outputIndex, value) {
    this.index = outputIndex,
    this.value = value
  }
}

module.exports = {
  Block,
  Transaction,
  TransactionInput,
  TransactionOutput
}
