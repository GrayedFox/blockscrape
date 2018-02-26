#!/usr/bin/env node

const { exec } = require('child_process')

const litecoin = '/blockscrape/litecoin.sh'
const litecoinCommands = require('./litecoin_api')

const client = (blockchain, args) => {
  if (!blockchain || !Array.isArray(args) || !args.length) {
    console.warn('Please specify a blockchain and provide an array of valid arguments!')
    process.exit()
  }

  exec(`${process.cwd()}${litecoin} ${args.join(' ')}`, (err, stdout, stderr) => {

    console.log(`stdout: ${stdout}`)
    console.log(`stderr: ${stderr}`)
    console.log(`err: ${err}`)
  })
}

client(litecoin, [litecoinCommands.help, litecoinCommands.getInfo])

module.exports = {
  client
}
