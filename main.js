#!/usr/bin/env node

const fs = require('fs')
const cluster = require('cluster')
const { spawn } = require('child_process')
const numCPUs = require('os').cpus().length
const { scraper } = require('./scraper.js')

const blockchainCli = process.env.BLOCKSCRAPECLI || 'litecoin-cli'
const blockEnd = process.env.BLOCKSCRAPEEND || 100
let blockHeight = process.env.BLOCKSCRAPEBEGIN || 0

const messageHandler = (msg) => {
  if (msg.cmd && msg.cmd === 'blockDone') {
    blockHeight += 1
    console.log('incremented block height')
  }
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

const runScraper = () => {
  if (blockEnd === undefined || typeof(blockEnd) !== 'number') {
    console.error('Error! BLOCKSCRAPEEND must be defined in your local environment!')
    process.exit(1)
  }

  let stream = fs.createWriteStream('./exportedData.csv', { flags: 'a'})
  // will need to pass this to every instance of scraper that is being run so they append to the same
  // file

  if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`)

    for (let i = 0; i < numCPUs; i++) {
      cluster.fork()
    }

    for (const id in cluster.workers) {
      cluster.workers[id].on('message', messageHandler)
    }

    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`)
    })
  } else {
    console.log(`Worker ${process.pid} started...`)
    if ( blockHeight < blockEnd ) {
      // spawn scraper instance with current blockheight
      // if blockheight hasn't yet incremented, spawn first worker at blockHeight
      // and next workers at blockHeight + 1/2/3...N
      // finally, process.send({ cmd: 'blockDone'}) to increment blockHeight and start scraping on
      // next available worker
    }
  }
}

module.exports = {
  client,
  blockchainCli,
  blockHeight
}
