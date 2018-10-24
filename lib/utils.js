'use strict'

const crypto = require('crypto')
const fs = require('fs')
const { exec } = require('child_process')

module.exports = {
  exec (command) {
    return new Promise((resolve, reject) => {
      exec(command, (err, stdout, stderr) => {
        if (err) {
          err.stderr = stderr

          reject(err)
          return
        }

        resolve(stdout)
      })
    })
  },

  hash (algorithm, data) {
    return crypto.createHash(algorithm)
      .update(data)
      .digest('hex')
      .toUpperCase()
  },

  async isDirectory (path) {
    try {
      const stat = await this.stat(path)

      return stat.isDirectory()
    } catch (err) {
      return false
    }
  },

  async isFile (path) {
    try {
      const stat = await this.stat(path)

      return stat.isFile()
    } catch (err) {
      return false
    }
  },

  md5 (data) {
    return this.hash('md5', data)
  },

  readFile (path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          reject(err)
          return
        }

        resolve(data)
      })
    })
  },

  sha512 (data) {
    return this.hash('sha512', data)
  },

  stat (path) {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        if (err) {
          reject(err)
          return
        }

        resolve(stats)
      })
    })
  }
}
