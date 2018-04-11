#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const cluster = require('cluster')
const path = require('path')
const { scraper } = require('./scraper.js')

const cores = os.cpus()
const csvFile = `${path.resolve(__dirname)}/exportedData.csv`
const lastWrittenBlockFile = `${path.resolve(__dirname)}/storage/last-written-block.save`
const failedBlocksFile = `${path.resolve(__dirname)}/storage/failed-blocks.save`
const csvSaveLocation = `${path.resolve(__dirname)}/dumps/`

let blockBegin = process.env.BLOCKSCRAPEFROM
let blockEnd = process.env.BLOCKSCRAPETO || 0
let blockLimit = process.env.BLOCKSCRAPELIMIT

let blocksToWrite = []
let orphanedBlocks = []
let failedBlocks = []
let blocksBeingScraped = {}
let firstBlock = true
let blockFailCheck = true
let blockHeight = undefined
let lastProcessedBlock = undefined
let csvWriteStream = undefined
let totalWorkers = 0
let totalBlocksScraped = 0

const openCsvWriteStream = () => { csvWriteStream = fs.createWriteStream(csvFile, { flags: 'a' }) }

const readLastWrittenBlockFromFile = () => fs.readFileSync(lastWrittenBlockFile, { encoding: 'utf8' })

const readFailedBlocksFromFile = () => fs.readFileSync(failedBlocksFile, { encoding: 'utf8' })

const writeFailedBlockToFile = (block) => fs.writeFileSync(failedBlocksFile, block, { flags: 'a' })

const clearFailedBlocksFile = () => fs.truncateSync(failedBlocksFile)

const saveExportedData = (name) => fs.renameSync(csvFile, `${csvSaveLocation}${name}`)

const scrapeNextBlock = (block) => {
  return new Promise( (resolve, reject) => {
    try {
      resolve(scraper(block))
    } catch (error) {
      reject(error)
    }
  })
}

const writeToCsvFile = (txData) => {
  let blockTransactions = []
  for (let tx of txData) {
    for (let i = 0; i < tx.length; i++) {
      if (i < tx.length - 1) {
        blockTransactions.push(tx[i])
      } else {
        blockTransactions.push(`${tx[i]}\n`)
      }
    }
  }

  // create formatted string of all txs in block in order to write entire blocks contents in single write
  let formattedTransactions = blockTransactions.reduce( (accumulator, currentValue) => {
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

// read failed blocks from file but don't push duplicates into oprhanedBlocks
const checkForFailedBlocks = () => {
  if (blockFailCheck === true) {
    blockFailCheck = false
    console.log('Checking failed blocks!')
    failedBlocks = readFailedBlocksFromFile().split('\n')
    for (let i = 0; i < failedBlocks.length; i++) {
      // reading a file with empty lines results in populating an array with elements containing a blank string only,
      // which we want to ignore by checking the length of each element, which we must do before converting the string
      // to a number since unary + conversion will change empty strings to 0 (which has a length gt 1)
      if (failedBlocks[i].length > 0) {
        let failedBlockHeight = +failedBlocks[i]
        if (orphanedBlocks.indexOf(failedBlockHeight) === -1) {
          orphanedBlocks.push(failedBlockHeight)
        }
      }
    }
    failedBlocks = []
    clearFailedBlocksFile()
  }
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

const blockHandler = (worker) => {
  if (orphanedBlocks.length > 0) {
    const orphanedBlockHeight = orphanedBlocks.shift()
    blocksBeingScraped[worker.process.pid] = orphanedBlockHeight
    worker.send( { cmd: 'nextBlock', nextBlock: orphanedBlockHeight })
  } else {
    if (blockHeight > blockEnd && totalBlocksScraped <= blockLimit) {
      blockHeight -= 1
      totalBlocksScraped += 1
      blocksBeingScraped[worker.process.pid] = blockHeight
      worker.send({ cmd: 'nextBlock', nextBlock: blockHeight })
    } else {
      console.log('Block limit reach or no more blocks to scrape! Shutting worker down...')
      worker.kill('SIGQUIT')
    }
  }
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

const main = () => {
  const forkWorkers = (amount) => {
    for (let i = 0; i < amount; i++) {
      cluster.fork()
      totalWorkers += 1
    }
  }

  const setUp = (reboot = false) => {
    if (blockBegin === undefined || reboot === true) {
      blockBegin = (readLastWrittenBlockFromFile() - 1)
    }

    if (blockBegin < blockEnd) {
      blockBegin = blockEnd + (blockEnd = blockBegin, 0)
    }

    if (blockLimit === 0) {
      blockLimit = blockBegin - blockEnd
    }

    totalBlocksScraped = 0
    firstBlock = true
    blockHeight = blockBegin

    openCsvWriteStream()
    forkWorkers(cores.length)

    console.log(`First block set to: ${blockBegin}`)
    console.log(`Final block set to: ${blockEnd}`)
    console.log(`Block limit set to ${blockLimit}`)
  }

  if (cluster.isMaster) {
    console.log(`Master process ${process.pid} is running`)

    setUp()

    cluster.on('message', (worker, message) => {
      if (message.data) {
        storeTransactionData(message.data, message.block)
        writeBlockData(message.block)
      }

      // block range is inclusive due to incrementing blockHeight before scraping
      switch (message.msg) {
        case 'beginScraping':
          checkForFailedBlocks()
          if (firstBlock === true) {
            firstBlock = false
            blocksBeingScraped[message.pid] = blockHeight
            worker.send({ cmd: 'nextBlock', nextBlock: blockHeight })
            totalBlocksScraped += 1
          } else {
            blockHandler(worker)
          }
          break

        case 'blockDone':
          blockHandler(worker)
          break

        default:
          console.error(`Unexpected message: ${JSON.stringify(message)}, shutting down worker with exit code 1`)
          worker.kill('SIGKILL')
      }
    })

    cluster.on('exit', (worker, code, signal) => {
      totalWorkers -= 1
      if (signal !== 'SIGQUIT') {
        console.error(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`)
        writeFailedBlockToFile(`${blocksBeingScraped[worker.process.pid]}\n`)
        blockFailCheck = true
        console.error(`Wrote ${blocksBeingScraped[worker.process.pid]} to failed blocks file`)
        delete (blocksBeingScraped[worker.process.pid])
        console.error(`Deleted worker pid ${worker.process.pid} from blocksBeingScraped object`)
        cluster.fork()
        totalWorkers += 1
      } else {
        if (totalWorkers === 0) {
          console.log('Job done, saving data to dumps folder and closing write stream...')
          csvWriteStream.end()
          saveExportedData(`blocks-${blockBegin}-${readLastWrittenBlockFromFile()}.csv`)
          if (blockHeight > blockEnd) {
            setUp(true)
          }
        }
      }
    })
  } else {
    console.log(`Worker ${process.pid} started...`)

    process.on('message', async (message) => {
      if (message.cmd === 'nextBlock') {
        const result = Object.assign({ pid: process.pid }, await scrapeNextBlock(message.nextBlock))

        console.log(`Worker ${process.pid} finished block ${result.block} holding ${result.txTotal} transactions`)

        process.send(result)
      }
    })

    process.send({ msg: 'beginScraping', pid: process.pid })
  }
}

main()
