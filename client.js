const https = require('https')
const { spawn } = require('child_process')
const { LRUMap } = require('lru_map')

const blockchainApi = process.env.BLOCKSCRAPEAPI
const blockchainApiToken = process.env.BLOCKSCRAPEAPITOKEN
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

const remote = (request, args) => {
  const requestHostName = blockchainApi.match(/[^/]*/)[0]
  const requestPath = `${blockchainApi.match(/\/(.*)/)[0]}${request}`

  const options = {
    hostname: requestHostName,
    path: requestPath,
    port: args.port,
    method: args.method,
    strictSSL: args.strictSSL
  }

  return new Promise( (resolve, reject) => {
    https.request(options, (response) => {
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

/**
 *  This is the central component for spawning https requests or child processes which in turn query data from the user
 *  defined blockchain (i.e. litecoin-cli or api.blockcypher.com).
 *
 *  [Spawns a promisified data stream using spawn() or https.request() based on "command" with optional "params"]
 *  @param  {[array]} command :: the command/endpoint/url with required argument(s) -- required
 *  @param  {[array]} params  :: optional parameters for the given command -- optional
 *  @return {[promise]}       :: returns a promise; resolved when data stream ends, rejected on error
 **/
const client = (command, params, args) => {
  if (typeof(params) !== 'undefined' && Array.isArray(params) === false) {
    console.error(`Optional params must be an array! Instead got ${typeof(params)}`)
    process.exit(1)
  }

  if (blockchainApi) {
    let queryString = ''
    if (Array.isArray(params)) {
      queryString = `?${params.join('&')}`
    }

    return remote(`${command.join('/')}${queryString}`, args)
  } else {
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
  blockchainApiToken,
  blockchainCli
}
