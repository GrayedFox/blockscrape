const { spawn } = require('child_process')

const blockchainCli = process.env.BLOCKSCRAPECLI || 'litecoin-cli'

const client = (args) => {
  if (!Array.isArray(args) || !args.length) {
    console.error('Please provide an array of valid arguments!')
    process.exit(1)
  }

  return new Promise( (resolve, reject) => {
    let result = ''
    let resultError = ''
    let child = spawn(`${blockchainCli} ${args.join(' ')}`, {
      shell: true
    })

    child.on('error', (err) => {
      console.error(`errored with: ${err}`)
    })

    child.on('exit', (code, signal) => {
      if (code !== 0 || signal !== null) {
        console.warn(`exited with code ${code} and signal: ${signal}`)
      }
    })

    child.on('close', (reason) => {
      if (reason !== 0) {
        console.warn(`closed for reason: ${reason}`)
        reject(resultError)
      } else {
        resolve(result)
      }
    })

    child.on('message', (message) => {
      console.log(`message recieved: ${message}`)
    })

    child.stdout.on('data', (data) => {
      result += data.toString()
    })

    child.stderr.on('data', (data) => {
      resultError += data.toString()
    })
  })
}

module.exports = {
  client,
  blockchainCli
}
