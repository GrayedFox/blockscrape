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

const promiseScrape = () => {
  return new Promise( (resolve, reject) => {
    try {
      resolve(scraper(blockHeight, csvWriteStream))
      blockHeight += 1
    } catch (err) {
      reject(err)
    }
  })
}

const worker = async (process) => {
  let message = await promiseScrape()
  process.send(message)
}

const main = () => {
  if (blockEnd === undefined || typeof(blockEnd) !== 'number') {
    console.error('Error! BLOCKSCRAPEEND must be defined in your local environment!')
    process.exit(1)
  }

  if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`)
    const messageHandler = (msg) => {
      if (!msg || msg === '') {
        console.error('Error! Message must be defined and cannot be empty string!')
        return
      }

      switch (msg) {
        case 'nextBlock':
          console.log('Proceeding to next block')
          worker(process)
          break

        case 'shutdown':
          console.log('Shutting down worker')
          process.kill()
          break

        default:
          console.error(`Should not see this message: ${msg}`)
      }
    }

    for (let i = 0; i < cores.length; i++) {
      cluster.fork()
    }

    for (const id in cluster.workers) {
      cluster.workers[id].on('message', messageHandler)
    }

    cluster.on('message', (worker, message) => {
      console.log(`Worker ${worker.process.pid} sent message: ${message}`)
      if (blockHeight <= blockEnd) {
        worker.send('jerryCan') // <-- doesn't work?
      } else {
        worker.send('shutdown')
      }
    })

    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`)
    })
  } else {
    console.log(`Worker ${process.pid} started...`)
    process.send('nextBlock')
  }
}

openCsvWriteStream()
main()
