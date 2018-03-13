#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const cluster = require('cluster')
const { scraper } = require('./scraper.js')

const blockBegin = process.env.BLOCKSCRAPEBEGIN || 1234000
const blockEnd = process.env.BLOCKSCRAPEEND || 1234020
const cores = os.cpus()

let blockHeight = blockBegin
let firstBlock = true
let csvWriteStream = undefined
let lastWrittenBlock = undefined
let blocks = []

const openCsvWriteStream = () => {
  csvWriteStream = fs.createWriteStream('./exportedData.csv', { flags: 'a'})
}

const scrapeNextBlock = (block) => {
  return new Promise( (resolve, reject) => {
    try {
      resolve(scraper(block))
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

  const writeToCsvFile = (txData) => {
    for (let tx of txData) {
      for (let i = 0; i < tx.length; i++) {
        if (i < tx.length - 1) {
          csvWriteStream.write(`${tx[i]},`)
        } else {
          csvWriteStream.write(`${tx[i]}\n`)
        }
      }
    }
  }

  const writeBlockData = () => {
    let blocksToPurge = 0

    for (let i = 0; i < blocks.length; i++) {
      const currentBlock = blocks[i][0][0]

      if (lastWrittenBlock === undefined && currentBlock === blockBegin) {
        lastWrittenBlock = blockBegin
        blocksToPurge += 1
        writeToCsvFile(blocks[i])
      }

      if ((lastWrittenBlock + 1) === currentBlock) {
        lastWrittenBlock += 1
        blocksToPurge += 1
        writeToCsvFile(blocks[i])
      }
    }

    blocks = blocks.slice(blocksToPurge)
  }

  const storeTransactionData = (txData, txBlockHeight) => {
    if (txData.length === 0) {
      blocks.push([[txBlockHeight, 'Has no valid transactions...']])
    } else {
      if (blocks.length === 0) {
        blocks.push(txData)
      } else {
        let updatedBlockData = blocks
        for (let i = 0; i < blocks.length; i++) {
          const currentBlockNumber = blocks[i][0][0]
          let nextBlockNumber = undefined

          if (blocks[i+1]) {
            nextBlockNumber = blocks[i+1][0][0]
          }

          if (txBlockHeight < currentBlockNumber && i === 0) {
            updatedBlockData.unshift(txData)
            break
          }

          if (txBlockHeight > currentBlockNumber && txBlockHeight < nextBlockNumber && nextBlockNumber) {
            updatedBlockData.splice((i+1), 0, txData)
            break
          }

          if (i + 1 === blocks.length) {
            updatedBlockData.push(txData)
            break
          }
        }
        blocks = updatedBlockData
      }
    }
  }

  if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`)
    for (let i = 0; i < cores.length; i++) {
      cluster.fork()
    }

    cluster.on('message', (worker, result) => {
      if (result.data) {
        storeTransactionData(result.data, result.block)
        writeBlockData(result.block)
      }

      // block range is inclusive due to incrementing blockHeight before scraping
      if (blockHeight < blockEnd) {
        switch (result.msg) {
          case 'beginScraping':
            if (firstBlock === true) {
              firstBlock = false
              worker.send({ cmd: 'nextBlock', currentBlock: blockHeight })
            } else {
              blockHeight += 1
              worker.send({ cmd: 'nextBlock', currentBlock: blockHeight })
            }
            break

          case 'blockDone':
            blockHeight += 1
            worker.send({ cmd: 'nextBlock', currentBlock: blockHeight })
            break

          default:
            console.error(`Unexpected message: ${JSON.stringify(result)}, shutting down worker with exit code 1`)
            worker.kill(1)
        }
      } else {
        console.log('No more blocks to scrape! Shutting worker down...')
        worker.kill(0)
      }
    })

    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`)
    })
  } else {
    console.log(`Worker ${process.pid} started...`)

    process.on('message', async (msg) => {
      if (msg.cmd === 'nextBlock') {
        let result = await scrapeNextBlock(msg.currentBlock)
        process.send(result)
      }
    })

    process.send({ msg: 'beginScraping' })
  }
}

openCsvWriteStream()
main()
