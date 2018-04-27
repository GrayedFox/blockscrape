const https = require('https')
const { spawn } = require('child_process')
const { LRUMap } = require('lru_map')

const blockchainApi = process.env.BLOCKSCRAPEAPI
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

const local = (command) => {
  return new Promise( (resolve, reject) => {
    let result = ''
    let resultError = ''
    let child = spawn(command, { shell: '/bin/bash' })

    child.stderr.setEncoding('utf8')
    child.stdout.setEncoding('utf8')

    child.stdout.on('data', (chunk) => {
      result += chunk
    })

    child.stderr.on('data', (chunk) => {
      resultError += chunk
    })

    child.on('error', (err) => {
      console.error(`Errored with: ${err}!`)
    })

    child.on('exit', (code, signal) => {
      if (code !== 0 || signal !== null) {
        console.warn(`Exited with code ${code} and signal: ${signal}`)
      }
    })

    child.on('close', (reason) => {
      if (reason !== 0) {
        console.warn(`Closed for reason: ${reason}`)
        reject(resultError)
      } else {
        resolve(result)
      }
    })

    child.on('message', (message) => {
      console.log(`Message recieved: ${message}`)
    })
  })
}

const remote = (request) => {
  return new Promise( (resolve, reject) => {
    https.get(request, (response) => {
      let data = ''

      response.setEncoding('utf8')

      response.on('data', (chunk) => {
        data += chunk
      })

      response.on('end', () => {
        resolve(JSON.parse(data))
      })
    }).on('error', (err) => {
      reject(err)
    })
  })
}

const client = (command, params) => {
  if (blockchainApi) {
    return remote(`${command, params.join('')}`) //ToDo: will need to add logic here to process url params (?begin,var=value,&add)
  } else {
    if (typeof(params) !== 'undefined' && Array.isArray(params) === false) {
      console.error(`Optional params must be an array! Instead got ${typeof(params)}`)
      process.exit(1)
    }

    if (Array.isArray(params)) {
      command.push(...params)
    }

    return local(`${blockchainCli} ${command.join(' ')}`)
  }
}

module.exports = {
  cache,
  client,
  blockchainApi,
  blockchainCli
}
