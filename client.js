const { spawn } = require('child_process')
const { LRUMap } = require('lru_map')

const blockchainCli = process.env.BLOCKSCRAPECLI || 'litecoin-cli'
const cacheSize = process.env.BLOCKSCRAPECACHESIZE || 100000

let txVoutCache = new LRUMap(cacheSize)

// args should be an array structured like [operation, key, value]
const cache = (args) => {
  return new Promise ( (resolve, reject) => {
    let result = undefined

    switch (args[0]) {
      case 'get':
        result = txVoutCache.get(args[1])
        resolve(result)
        break

      case 'set':
        result = txVoutCache.set(args[1], args[2])
        resolve(result)
        break

      case 'exists':
        result = txVoutCache.has(args[1])
        resolve(result)
        break

      default:
        reject(`Error! Operation ${args[0]} not recognized!`)
    }
  })
}

const client = (args) => {
  return new Promise( (resolve, reject) => {
    let result = ''
    let resultError = ''
    let child = spawn(`${blockchainCli} ${args.join(' ')}`, {
      shell: '/bin/bash'
    })

    child.stderr.setEncoding('utf8')
    child.stdout.setEncoding('utf8')

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
      result += data
    })

    child.stderr.on('data', (data) => {
      resultError += data
    })
  })
}

module.exports = {
  cache,
  client,
  blockchainCli
}
