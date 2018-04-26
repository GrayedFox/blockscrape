// careful when converting - this assumes a standard Satoshi ratio (i.e. 1 BTC = 100,000,000 Satoshis)
// see https://en.bitcoin.it/wiki/Proper_Money_Handling_(JSON-RPC)
const convertToSatoshis = (value) => Math.round(1e8 * value)

// takes an epoch time and returns the commonly used ISO date string format
const convertEpochToIso = (epochTime) => {
  if (typeof(epochTime) === 'number') {
    let date = new Date(epochTime * 1000)
    return date.toISOString()
  } else {
    console.log(`Tried to convert non-number value ${epochTime} into ISO string!`)
    return epochTime
  }
}

class Transaction {
  constructor() {
    this.txid = '',
    this.value = 0,
    this.fee = 0,
    this.timeConfirmed = '',
    this.timeReceived = '',
    this.inputs = [],
    this.outputs = []
  }

  convertValuesToSatoshis() {
    this.value = convertToSatoshis(this.value)
    this.outputs = this.outputs.map( (elem) => {
      return elem.value = convertToSatoshis(elem.value)
    })
  }

  convertTimesToISO() {
    this.timeConfirmed = convertEpochToIso()
    this.timeReceived = convertEpochToIso()
  }
}

class InputTransaction {
  constructor(txid, inputIndex, value) {
    this.txid = txid,
    this.inputIndex = inputIndex,
    this.value = value
  }
}

class OutputTransaction {
  constructor(outputIndex, value) {
    this.outputIndex = outputIndex,
    this.value = value
  }
}

module.exports = {
  Transaction,
  InputTransaction,
  OutputTransaction
}
