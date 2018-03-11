#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const cluster = require('cluster')
const { scraper } = require('./scraper.js')

const blockBegin = process.env.BLOCKSCRAPEBEGIN || 1234000
const blockEnd = process.env.BLOCKSCRAPEEND || 1235000
const cores = os.cpus()

let blockHeight = blockBegin
let firstBlock = true
let csvWriteStream = undefined

const openCsvWriteStream = () => {
  csvWriteStream = fs.createWriteStream('./exportedData.csv', { flags: 'a'})
}

const scrapeNextBlock = (block) => {
  return new Promise( (resolve, reject) => {
    try {
      resolve(scraper(block, csvWriteStream))
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

  if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`)
    for (let i = 0; i < cores.length; i++) {
      cluster.fork()
    }

    cluster.on('message', (worker, message) => {
      if (blockHeight <= blockEnd) {
        if (message === 'beginScraping' && firstBlock === true) {
          firstBlock = false
          worker.send('nextBlock')
        }

        if (message === 'blockDone' || (message === 'beginScraping' && firstBlock === false)) {
          blockHeight += 1
          worker.send({ cmd: 'nextBlock', currentBlock: blockHeight })
        } else {
          console.error(`Unexpected message: ${message}, shutting down worker with exit code 1`)
          worker.kill(1)
        }
      } else {
        console.log('No more blocks to scrape! Shutting down worker with exit code 0')
        worker.kill()
      }
    })

    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`)
    })
  } else {
    console.log(`Worker ${process.pid} started...`)

    process.on('message', async (msg) => {
      if (!msg || msg.cmd === '') {
        console.error('Error! Message must be defined and cannot be empty string!')
        return
      }

      if (msg.cmd === 'nextBlock') {
        let result = await scrapeNextBlock(msg.currentBlock)
        process.send(result)
      }
    })

    process.send('beginScraping')
  }
}

openCsvWriteStream()
main()
