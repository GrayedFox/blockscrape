#!/usr/bin/env node

const { exec } = require('child_process')

const client = (command, args) => {
  if (!command || !Array.isArray(args) || !args.length) {
    console.warn('Please specify a command and provide an array arguments!')
    process.exit()
  }

  exec(`${command} ${args.join(' ')}`, (err, stdout, stderr) => {
    if (err || stderr) {
      console.warn('Error!')
      console.log(`stderr: ${stderr}`)
      console.log(`err: ${err}`)
    } else {
      console.log(`stdout = ${stdout}`)
      return stdout
    }
  })
}

module.exports = {
  client
}
