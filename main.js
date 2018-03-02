#!/usr/bin/env node

const { spawn } = require('child_process')

const client = (command, args) => {
  if (!command || !Array.isArray(args) || !args.length) {
    console.warn('Please specify a command and provide an array arguments!')
    process.exit(1)
  }

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled rejection error: ${err}`)
    process.exit(1)
  })

  process.setMaxListeners(20)

  return new Promise( (resolve, reject) => {
    let worker = spawn(`${command} ${args.join(' ')}`, {
      shell: true
    })

    worker.on('error', (err) => {
      console.error(`errored with: ${err}`)
    })

    worker.on('exit', (code, signal) => {
      if (code !== 0 || signal !== null) {
        console.warn(`exited with code ${code} and signal: ${signal}`)
      }
    })

    worker.on('close', (reason) => {
      if (reason !== 0) {
        console.warn(`closed for reason: ${reason}`)
      }
    })

    worker.on('message', (message) => {
      console.log(`message recieved: ${message}`)
    })

    worker.stdout.on('data', (data) => {
      resolve(data.toString())
    })

    worker.stderr.on('data', (data) => {
      reject(data.toString())
    })
  })
}

module.exports = {
  client
}
