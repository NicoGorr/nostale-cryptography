'use strict'

const { Transform } = require('stream')

class DecryptLoginStream extends Transform {
  constructor () {
    super({
      decodeStrings: false,
      encoding: null
    })
  }

  _write (packet, encoding, callback) {
    if (!Buffer.isBuffer(packet)) {
      callback(new TypeError('The first argument must be a login encrypted packet buffer.'))
      return
    }

    const length = packet.length - 1
    const decrypted = Buffer.allocUnsafe(length)

    for (let i = 0; i < length; i++) {
      decrypted[i] = packet[i] - 0x0F
    }

    callback(null, decrypted)
  }
}

module.exports = DecryptLoginStream
