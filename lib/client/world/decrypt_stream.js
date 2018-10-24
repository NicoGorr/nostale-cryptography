'use strict'

const { Transform } = require('stream')

class DecryptWorldStream extends Transform {
  constructor () {
    super({
      decodeStrings: false,
      encoding: null
    })

    this.charTable = [
      0x00, 0x20, 0x2D, 0x2E,
      0x30, 0x31, 0x32, 0x33,
      0x34, 0x35, 0x36, 0x37,
      0x38, 0x39, 0x0A, 0x00
    ]

    this.state = {
      index: 0,
      buffer: null,
      length: 0
    }
  }

  _transform (packet, _, callback) {
    if (!Buffer.isBuffer(packet)) {
      callback(new TypeError('The first argument must be a world encrypted packet\'s buffer.'))
      return
    }

    if (this.state.buffer != null) {
      packet = Buffer.concat([this.state.buffer, packet], this.state.length + packet.length)

      this.state.index = 0
      this.state.buffer = null
      this.state.length = 0
    }

    const len = packet.length

    let currentPacket = []
    let index = 0
    let currentByte = 0
    let length = 0
    let first = 0
    let second = 0

    while (index < len) {
      currentByte = packet[index++]

      if (currentByte === 0xFF) {
        this.push(Buffer.from(currentPacket))
        currentPacket = []
        this.state.index = index
        continue
      }

      length = (currentByte & 0x7F)
      if (currentByte & 0x80) {
        while (length) {
          if (index <= len) {
            currentByte = packet[index++]

            first = this.charTable[(currentByte & 0xF0) >> 4]
            currentPacket.push(first)

            if (length <= 1) {
              break
            }

            second = this.charTable[currentByte & 0xF]
            currentPacket.push(second)

            length -= 2
          } else {
            length--
          }
        }
      } else {
        while (length) {
          if (index <= len) {
            currentPacket.push(packet[index++] ^ 0xFF)
          }

          length--
        }
      }
    }

    if (index > this.state.index) {
      const temp = packet.slice(this.state.index)

      this.state.buffer = temp
      this.state.length = temp.length
    }

    callback()
  }
}

module.exports = DecryptWorldStream
