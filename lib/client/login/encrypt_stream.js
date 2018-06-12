'use strict'

const { Transform } = require('stream')

class EncryptLoginStream extends Transform {
  constructor () {
    super({
      decodeStrings: false,
      encoding: null
    })
  }

  _write (packet, encoding, callback) {
    if (!Buffer.isBuffer(packet)) {
      callback(new TypeError('The first argument must be a login plain packet buffer.'))
      return
    }

    const { length } = packet
    const encrypted = Buffer.allocUnsafe(length + 1)

    for (let i = 0; i < length; i++) {
      encrypted[i] = (packet[i] ^ 0xC3) + 0x0F
    }
    encrypted[length] = 0xD8

    callback(null, encrypted)
  }
}

module.exports = EncryptLoginStream
