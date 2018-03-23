#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const cluster = require('cluster')
const path = require('path')
const { scraper } = require('./scraper.js')

const cores = os.cpus()
const lastWrittenBlockFile = `${path.resolve(__dirname)}/last-written-block`
const csvFile = `${path.resolve(__dirname)}/exportedData.csv`

let blockBegin = process.env.BLOCKSCRAPEFROM
let blockEnd = process.env.BLOCKSCRAPETO || 0

let blocksToWrite = []
let firstBlock = true
let blockHeight = undefined
let lastProcessedBlock = undefined
let csvWriteStream = undefined

const openCsvWriteStream = () => { csvWriteStream = fs.createWriteStream(csvFile, { flags: 'a' }) }

const lastWrittenBlockFromFile = () => fs.readFileSync(lastWrittenBlockFile, { encoding: 'utf8' })

const scrapeNextBlock = (block) => {
  return new Promise( (resolve, reject) => {
    try {
      resolve(scraper(block))
    } catch (error) {
      reject(error)
    }
  })
}

const main = () => {
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

    // create formatted string of all txs in block in order to write entire blocks contents in single write
    let formattedTransactions = blockToWrite.reduce( (accumulator, currentValue) => {
      const stringValue = '' + currentValue
      if (stringValue.endsWith('\n')) {
        accumulator += `${stringValue}`
      } else {
        accumulator += `${stringValue},`
      }
      return accumulator
    }, '')

    csvWriteStream.write(formattedTransactions)
    fs.writeFileSync(lastWrittenBlockFile, txData[0][0])
  }

  const writeBlockData = () => {
    let blocksToPurge = 0

    for (let i = 0; i < blocksToWrite.length; i++) {
      const currentBlockHeight = blocksToWrite[i][0][0]

      if (lastProcessedBlock === undefined && currentBlockHeight === blockBegin) {
        lastProcessedBlock = currentBlockHeight
        blocksToPurge += 1
        writeToCsvFile(blocksToWrite[i])
      }

      if ((lastProcessedBlock - 1) === currentBlockHeight) {
        lastProcessedBlock = currentBlockHeight
        blocksToPurge += 1
        writeToCsvFile(blocksToWrite[i])
      }
    }

    blocksToWrite = blocksToWrite.slice(blocksToPurge)
  }

  // store blocks inside blocksToWrite array based on block height in descending order
  const storeTransactionData = (txData, txBlockHeight) => {
    if (txData.length === 0) {
      txData = [[txBlockHeight, 'COINBASETRANSACTIONONLY']]
    }

    if (blocksToWrite.length === 0) {
      blocksToWrite.push(txData)
    } else {
      let updatedBlockData = blocksToWrite
      for (let i = 0; i < blocksToWrite.length; i++) {
        const currentBlockHeight = blocksToWrite[i][0][0]
        let nextBlockHeight = undefined

        if (blocksToWrite[i+1]) {
          nextBlockHeight = blocksToWrite[i+1][0][0]
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
        if (i + 1 === blocksToWrite.length) {
          updatedBlockData.push(txData)
          break
        }
      }
      blocksToWrite = updatedBlockData
    }
  }

  if (cluster.isMaster) {
    if (blockBegin === undefined) {
      blockBegin = (lastWrittenBlockFromFile() - 1)
    }

    if (blockBegin < blockEnd) {
      blockBegin = blockEnd + (blockEnd = blockBegin, 0)
    }

    blockHeight = blockBegin

    console.log(`Master process ${process.pid} is running`)
    console.log(`Starting block set to: ${blockBegin}`)
    console.log(`Final block set to: ${blockEnd}`)

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
              worker.send({ cmd: 'nextBlock', nextBlock: blockHeight })
            } else {
              blockHeight -= 1
              worker.send({ cmd: 'nextBlock', nextBlock: blockHeight })
            }
            break

          case 'blockDone':
            blockHeight -= 1
            worker.send({ cmd: 'nextBlock', nextBlock: blockHeight })
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
        let result = await scrapeNextBlock(msg.nextBlock)
        process.send(result)
      }
    })

    process.send({ msg: 'beginScraping' })
  }
}

main()
