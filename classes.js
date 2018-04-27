/**
  * Classes and class specfic helper functions, namely @Transacion, @InputTransaction and @OutputTransaction
**/

// careful when converting - this assumes a standard Satoshi ratio (i.e. 1 BTC = 100,000,000 Satoshis)
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

// takes an epoch time and returns the commonly used ISO date string format
const convertEpochToIso = (epochTime) => {
  if (typeof(epochTime) === 'number') {
    let date = new Date(epochTime * 1000)
    return date.toISOString()
  } else {
    return epochTime
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
  Transaction,
  TransactionInput,
  TransactionOutput
}
