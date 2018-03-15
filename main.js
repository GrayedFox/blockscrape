#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const cluster = require('cluster')
const { scraper } = require('./scraper.js')
const { takeMemorySnapshot } = require('./debug.js')

const blockBegin = process.env.BLOCKSCRAPEBEGIN || 1379480
const blockEnd = process.env.BLOCKSCRAPEEND || 1379430
const cores = os.cpus()

let blockHeight = blockBegin
let firstBlock = true
let csvWriteStream = undefined
let lastWrittenBlock = undefined
let blocks = []
let snapshotBlockCount = 0

const openCsvWriteStream = () => {
  csvWriteStream = fs.createWriteStream('./exportedData.csv', { flags: 'a' })
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
    let blockToWrite = []
    for (let tx of txData) {
      for (let i = 0; i < tx.length; i++) {
        if (i < tx.length - 1) {
          blockToWrite.push(tx[i])
        } else {
          blockToWrite.push(`${tx[i]}\n`)
        }
      }
    }

    let formattedBlock = blockToWrite.reduce( (accumulator, currentValue) => {
      const stringValue = '' + currentValue
      if (stringValue.endsWith('\n')) {
        accumulator += `${stringValue}`
      } else {
        accumulator += `${stringValue},`
      }
      return accumulator
    }, '')

    csvWriteStream.write(formattedBlock)
  }

  const writeBlockData = () => {
    let blocksToPurge = 0

    for (let i = 0; i < blocks.length; i++) {
      const currentBlock = blocks[i][0][0]

      if (lastWrittenBlock === undefined && currentBlock === blockBegin) {
        lastWrittenBlock = blockBegin
        blocksToPurge += 1
        snapshotBlockCount += 1
        writeToCsvFile(blocks[i])
      }

      if ((lastWrittenBlock - 1) === currentBlock) {
        lastWrittenBlock = currentBlock
        blocksToPurge += 1
        snapshotBlockCount += 1
        writeToCsvFile(blocks[i])
      }
    }

    if (snapshotBlockCount >= 200) {
      snapshotBlockCount = 0
      takeMemorySnapshot()
    }

    blocks = blocks.slice(blocksToPurge)
  }

  // store blocks inside blocks array based on block height in descending order
  const storeTransactionData = (txData, txBlockHeight) => {
    if (txData.length === 0) {
      txData = [[txBlockHeight, 'COINBASETRANSACTIONONLY']]
    }

    if (blocks.length === 0) {
      blocks.push(txData)
    } else {
      let updatedBlockData = blocks
      for (let i = 0; i < blocks.length; i++) {
        const currentBlockHeight = blocks[i][0][0]
        let nextBlockHeight = undefined

        if (blocks[i+1]) {
          nextBlockHeight = blocks[i+1][0][0]
        }
        // push to beginning of blocks array if txBlockHeight higher than block height of first block
        if (txBlockHeight > currentBlockHeight && i === 0) {
          updatedBlockData.unshift(txData)
          break
        }
        // squeeze into next slot if txBlockHeight lower than currentBlockHeight and higher than nextBlockHeight
        if (txBlockHeight < currentBlockHeight && txBlockHeight > nextBlockHeight && nextBlockHeight) {
          updatedBlockData.splice((i+1), 0, txData)
          break
        }
        // push to end of blocks array if on final loop as block height must necessarily be lower than stored blocks
        if (i + 1 === blocks.length) {
          updatedBlockData.push(txData)
          break
        }
      }
      blocks = updatedBlockData
    }
  }

  if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`)
    openCsvWriteStream()

    for (let i = 0; i < cores.length; i++) {
      cluster.fork()
    }

    cluster.on('message', (worker, result) => {
      if (result.data) {
        storeTransactionData(result.data, result.block)
        writeBlockData(result.block)
      }

      // block range is inclusive due to incrementing blockHeight before scraping
      if (blockHeight > blockEnd) {
        switch (result.msg) {
          case 'beginScraping':
            if (firstBlock === true) {
              firstBlock = false
              worker.send({ cmd: 'nextBlock', currentBlock: blockHeight })
            } else {
              blockHeight -= 1
              worker.send({ cmd: 'nextBlock', currentBlock: blockHeight })
            }
            break

          case 'blockDone':
            blockHeight -= 1
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

main()
