#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const cluster = require('cluster')
const { scraper } = require('./scraper.js')

const blockBegin = process.env.BLOCKSCRAPEBEGIN || 1234000
const blockEnd = process.env.BLOCKSCRAPEEND || 1234100
const cores = os.cpus()

let blockHeight = blockBegin
let csvWriteStream = undefined

const openCsvWriteStream = () => {
  csvWriteStream = fs.createWriteStream('./exportedData.csv', { flags: 'a'})
}

const scrapeNextBlock = () => {
  return new Promise( (resolve, reject) => {
    try {
      resolve(scraper(blockHeight, csvWriteStream))
      blockHeight += 1
    } catch (err) {
      reject(err)
    }
  })
}

const main = () => {
  if (blockEnd === undefined || typeof(blockEnd) !== 'number') {
    console.error('Error! BLOCKSCRAPEEND must be defined in your local environment!')
    process.exit(1)
  }

  const messageHandler = async (msg) => {
    console.log(`Message handler recieved: ${msg}`)
    if (!msg || msg === '') {
      console.error('Error! Message must be defined and cannot be empty string!')
      return
    }

    if (msg === 'beginScraping' || msg === 'blockDone') {
      let result = await scrapeNextBlock()
      console.log(`Message from scraper: ${result}`)
      process.send(result) // < -- should send 'blockDone, which in turn calls this message handler recursively'
    }
  }

  if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`)

    for (let i = 0; i < cores.length; i++) {
      cluster.fork()
    }

    for (const id in cluster.workers) {
      cluster.workers[id].on('message', messageHandler)
    }

    cluster.on('message', (worker, message) => {
      console.log(`Master listened to ${worker.process.pid} send message: ${message}`)
    })

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
