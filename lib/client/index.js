'use strict'

const os = require('os')
const path = require('path')
const Utils = require('../utils')

const EncryptLoginStream = require('./login/encrypt_stream')
const EncryptWorldStream = require('./world/encrypt_stream')
const DecryptLoginStream = require('./login/decrypt_stream')
const DecryptWorldStream = require('./world/decrypt_stream')

const platform = os.platform()
const passwordLegacyTable = [
  '2E', '2A', '17', '4F',
  '20', '24', '47', '11',
  '5B', '37', '53', '43',
  '15', '34', '45', '25',
  '4B', '1D', '2F', '58',
  '2B', '32', '63'
]

module.exports = {
  createCipher (session) {
    if (session == null) {
      return new EncryptLoginStream()
    } else if (Number.isFinite(session)) {
      return new EncryptWorldStream(session)
    }

    throw new TypeError('The first agument must be null/undefined in order to get the Login Cipher or a session number in order to get the World Cipher.')
  },

  createDecipher (session) {
    if (session == null) {
      return new DecryptLoginStream()
    } else if (Number.isFinite(session)) {
      return new DecryptWorldStream(session)
    }

    throw new TypeError('The first argument must be null/undefined in order to get the Login Decipher or a session number in order to get the World Decipher.')
  },

  encryptPassword (password) {
    if (!Buffer.isBuffer(password)) {
      throw new TypeError('The first argument must be the account username buffer.')
    }

    return Utils.sha512(password)
  },

  encryptPasswordLegacy (password) {
    if (!Buffer.isBuffer(password)) {
      throw new TypeError('The first argument must be the account password buffer.')
    }

    let output = ''
    let randomStartPos = Math.floor(Math.random() * 22)
    let passwordHexString = password.toString('hex').toUpperCase()

    output += passwordLegacyTable[randomStartPos]

    for (let i = 0, l = passwordHexString.length; i < l; i += 2, randomStartPos++) {
      const currHex = passwordLegacyTable[randomStartPos]

      output += currHex.charAt(0) + passwordHexString.charAt(i)
      output += currHex.charAt(1) + passwordHexString.charAt(i + 1)

      if (randomStartPos === 22) {
        randomStartPos = -1
      }
    }

    return output
  },

  async createVersion (nosPathOrVersion, directx = 'NostaleClientX.exe') {
    let nosPath = null
    let version = null

    if (await Utils.isDirectory(nosPath)) {
      nosPath = nosPathOrVersion
    } else {
      if (nosPathOrVersion == null || nosPathOrVersion.split('.').length !== 4) {
        throw new Error(
          'Invalid Nostale Path/Client version. ' +
          'If you are on Windows you can either choose to provide the nostale path or a valid Client version as first argument. ' +
          'You can find the Client version by right clicking on NostaleClientX.exe > Properties > Details.'
        )
      }

      version = nosPath
    }

    const random = [
      0x00,
      Math.floor(Math.random() * 0x7E),
      Math.floor(Math.random() * 0x7E),
      Math.floor(Math.random() * 0x7E)
    ]
    const randomHex = Buffer.from(random).toString('hex').toUpperCase()

    if (version == null) {
      if (platform === 'win32') {
        const sanitizedPath = path.join(nosPath, directx).split('\\').join('\\\\')
        version = (await Utils.exec(`wmic datafile where name="${sanitizedPath}" get Version`)).toString().trim().split('\n').pop()
      } else {
        throw new Error(
          'On Linux/macOS you must provide the Client version as first argument. ' +
          'You can find the Client version by right clicking on NostaleClientX.exe > Properties > Details.'
        )
      }
    }

    return `${randomHex}\v${version}`
  },

  async createChecksumHash (username, nosPath, directx = 'NostaleClientX.exe', opengl = 'NostaleClient.exe') {
    if (!Buffer.isBuffer(username)) {
      throw new TypeError('The first argument must be the username buffer.')
    }
    if (typeof nosPath !== 'string' || !nosPath.length || !(await Utils.isDirectory(nosPath))) {
      throw new TypeError('The second argument must be the NosTale path folder')
    }
    if (typeof directx !== 'string' || !directx.length) {
      throw new TypeError('The third argument must be the NosTale DirectX executable filename (if null/undefined will be set to \'NostaleClientX.exe\').')
    }
    if (typeof opengl !== 'string' || !opengl.length) {
      throw new TypeError('The fourth argument must be the NosTale OpenGL executable filename (if null/undefined will be set to \'NostaleClient.exe\').')
    }

    const directxPath = path.join(nosPath, directx)
    const openglPath = path.join(nosPath, opengl)

    if (!(await Utils.isFile(directxPath))) {
      throw new Error(`The filepath "${directxPath}" doesn't exists. It might be that the NosTale's path or the DirectX filename are invalid.`)
    }
    if (!(await Utils.isFile(openglPath))) {
      throw new Error(`The filepath "${openglPath}" doesn't exists. It might be that the NosTale's path or the OpenGL filename are invalid.`)
    }

    directx = Utils.md5(await Utils.readFile(directxPath))
    opengl = Utils.md5(await Utils.readFile(openglPath))

    return Utils.md5(directx + opengl + username)
  },

  encryptSession (session) {
    if (!Number.isFinite(session)) {
      throw new Error('The first argument is not a valid session number, it\'s too big or it\'s negative.')
    }

    const sessBuffer = Buffer.allocUnsafe(4)
    sessBuffer.writeUInt32BE(session)

    const buffer = this._partialEncryptSessionPacket(sessBuffer)

    for (let i = 0, l = buffer.length; i < l; i++) {
      buffer[i] = (buffer[i] + 0x0F)
    }

    return buffer
  },

  _partialEncryptSessionPacket (packet) {
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
