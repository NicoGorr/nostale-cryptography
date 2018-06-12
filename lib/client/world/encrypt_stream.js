'use strict'

const { Transform } = require('stream')

class EncryptWorldStream extends Transform {
  constructor (session) {
    super({
      decodeStrings: false,
      encoding: null
    })

    if (!Number.isFinite(session)) {
      throw new TypeError('The first argument of the constructor must be a valid session number.')
    }

    this.session = session
  }

  _write (packet, encoding, callback) {
    if (!Buffer.isBuffer(packet)) {
      callback(new TypeError('The first argument must be a world plain packet\'s buffer.'))
      return
    }

    packet = this._partialEncryptWorldPacket(packet)

    const sessionNumber = (this.session >> 6) & 0xFF
    const sessionKey = (this.session + 0x40) & 0xFF

    switch (sessionNumber) {
      case 0:
        for (let i = 0, l = packet.length; i < l; i++) {
          packet[i] = (packet[i] + sessionKey)
        }
        break
      case 1:
        for (let i = 0, l = packet.length; i < l; i++) {
          packet[i] = (packet[i] - sessionKey)
        }
        break
      case 2:
        for (let i = 0, l = packet.length; i < l; i++) {
          packet[i] = ((packet[i] ^ 0xC3) + sessionKey)
        }
        break
      case 3:
        for (let i = 0, l = packet.length; i < l; i++) {
          packet[i] = ((packet[i] ^ 0xC3) - sessionKey)
        }
        break
    }

    callback(null, packet)
  }

  _partialEncryptWorldPacket (packet) {
    const packetLength = packet.length
    const packetMask = []
    const output = []
    let sequences = 0
    let sequenceCounter = 0
    let lastPosition = 0
    let currentPosition = 0
    let length = 0
    let currentByte = 0

    for (let i = 0; i < packetLength; i++) {
      let byte = packet[i]

      if (byte === 0x23) {
        packetMask.push(0)
        continue
      }

      if (!((byte -= 0x20) & 0xFF) || ((byte += 0xF1) & 0xFF) < 0 ||
        ((byte -= 0xB) & 0xFF) < 0 || !((byte -= 0xC5) & 0xFF)) {
        packetMask.push(1)
        continue
      }

      packetMask.push(0)
    };

    while (currentPosition <= packetLength) {
      lastPosition = currentPosition
      while (currentPosition < packetLength && !packetMask[currentPosition]) {
        currentPosition++
      }

      if (currentPosition) {
        length = (currentPosition - lastPosition)
        sequences = Math.floor(length / 0x7E)

        for (let i = 0; i < length; i++, lastPosition++) {
          if (i === (sequenceCounter * 0x7E)) {
            if (!sequences) {
              output.push(length - i)
            } else {
              output.push(0x7E)
              sequences--
              sequenceCounter++
            }
          }

          output.push(packet[lastPosition] ^ 0xFF)
        }
      }

      if (currentPosition >= packetLength) {
        break
      }

      lastPosition = currentPosition
      while (currentPosition < packetLength && packetMask[currentPosition]) {
        currentPosition++
      }

      if (currentPosition) {
        length = (currentPosition - lastPosition)
        sequences = Math.floor(length / 0x7E)

        for (let i = 0; i < length; i++, lastPosition++) {
          if (i === (sequenceCounter * 0x7E)) {
            if (!sequences) {
              output.push((length - i) | 0x80)
            } else {
              output.push(0x7E | 0x80)
              sequences--
              sequenceCounter++
            }
          }

          currentByte = packet[lastPosition]
          currentByte = currentByte === 0x20 ? 1
            : currentByte === 0x2D ? 2
              : currentByte === 0x2E ? 3
                : currentByte === 0xFF ? 0xE
                  : currentByte - 0x2C

          if (currentByte !== 0x00) {
            if (i % 2 === 0) {
              output.push(currentByte << 4)
            } else {
              output[output.length - 1] |= currentByte
            }
          }
        }
      }
    }
    output.push(0xFF)

    return Buffer.from(output)
  }
}

module.exports = EncryptWorldStream
