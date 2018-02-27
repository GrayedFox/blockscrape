#!/usr/bin/env node

const { exec } = require('child_process')

const client = (command, args) => {
  if (!command || !Array.isArray(args) || !args.length) {
    console.warn('Please specify a blockchain and provide an array of valid arguments!')
    process.exit()
  }

  exec(`${command} ${args.join(' ')}`, (err, stdout, stderr) => {

    console.log(`stdout: ${stdout}`)
    console.log(`stderr: ${stderr}`)
    console.log(`err: ${err}`)
  })
}

module.exports = {
  client
}
