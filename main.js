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

const main = () => {
  if (blockEnd === undefined || typeof(blockEnd) !== 'number') {
    console.error('Error! BLOCKSCRAPEEND must be defined in your local environment!')
    process.exit(1)
  }

  const messageHandler = (msg) => {
    if (!msg || msg === '') {
      console.error('Error! Message must be defined and cannot be blank!')
      return
    }

    if (msg === 'nextBlock') {
      scraper(blockHeight, csvWriteStream)
      blockHeight += 1
    }

    if (msg === 'beginScraping') {
      if (blockHeight <= blockEnd) {
        scraper(blockHeight, csvWriteStream)
        blockHeight += 1
      }
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

    cluster.on('blockDone', (worker) => {
      if (blockHeight <= blockEnd) {
        worker.send('nextBlock')
      } else {
        worker.kill()
      }
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
