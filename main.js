#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const cluster = require('cluster')
const { spawn } = require('child_process')
const { scraper } = require('./scraper.js')

const blockchainCli = process.env.BLOCKSCRAPECLI || 'litecoin-cli'
const blockEnd = process.env.BLOCKSCRAPEEND || 1234100
const blockBegin = process.env.BLOCKSCRAPEBEGIN || 1234000
const cores = os.cpus()

let blockHeight = blockBegin
let csvWriteStream = undefined

const openCsvWriteStream = () => {
  csvWriteStream = fs.createWriteStream('./exportedData.csv', { flags: 'a'})
}

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

const messageHandler = (msg) => {
  if (!msg || msg === '') {
    console.error('Error! Message must be defined and cannot be blank!')
    return
  }

  if (msg === 'blockDone') {
    if (blockHeight <= blockEnd) {
      scraper(blockHeight, csvWriteStream)
      blockHeight += 1
    }
  }

  if (msg === 'beginScraping') {
    scraper(blockHeight, csvWriteStream)
    blockHeight += 1
  }

  if (msg === 'shutdown') {
    process.disconnect()
  }
}

const main = () => {
  if (blockEnd === undefined || typeof(blockEnd) !== 'number') {
    console.error('Error! BLOCKSCRAPEEND must be defined in your local environment!')
    process.exit(1)
  }

  if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`)

    for (let i = 0; i < cores.length; i++) {
      cluster.fork()
    }

    for (const id in cluster.workers) {
      cluster.workers[id].on('message', messageHandler)
    }

    // add listeners which, if blockHeight is less than blockEnd, tell the worker to scrape the next block

    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`)
    })
  } else {
    console.log(`Worker ${process.pid} started...`)
    process.send('beginScraping')
  }
}

openCsvWriteStream()
main()

module.exports = {
  client,
  blockchainCli
}
