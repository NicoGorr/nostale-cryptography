# NosTale Cryptography

The NosTale Client, Server and Archive cryptographic algorithms for Node.js.

**NB:** Arguments wrapped into square brackets are optional.

## Installation

Using npm:

```
$ npm i nostale-cryptography
```

## Client API
In Node.js:

```js
const nosCrypto = require('nostale-cryptography').Client
// or
const nosCrypto = require('nostale-cryptography/client')

const nostalePath = 'C:\\Program Files (x86)\\NosTale_IT'
const username = Buffer.from('myUsername')
const password = Buffer.from('myPassword')
const session = 123456
const versionString = '0.9.3.3087'

// To get the Login Crypto you must pass nothing.
const encryptLoginStream = nosCrypto.createCipher()
const decryptLoginStream = nosCrypto.createDecipher()

// To get the World Crypto you must pass the session number.
const encryptWorldStream = nosCrypto.createCipher(session)
const decryptWorldStream = nosCrypto.createDecipher(session)

const encryptedSession = nosCrypto.encryptSession(session)

const encryptedPassword = nosCrypto.encryptPassword(password) // NosTale Gameforge
const encryptedPasswordLegacy = nosCrypto.encryptPasswordLegacy(password) // NosTale Vendetta

// On Windows
const version = nosCrypto.createVersion(nostalePath [, directx]) // Returns a Promise

// On Linux/macOS
const version = nosCrypto.createVersion(versionString) // Returns a Promise
/*
You can find the Client version by right clicking on
NostaleClientX.exe > Properties > Details
*/

const checksumHash = nosCrypto.createChecksumHash(username, nostalePath [, directx, opengl]) // Returns a Promise
```

Example:

```js
'use strict'

const { pipeline } = require('stream')
const iconv = require('iconv-lite')
const net = require('net')
const nosCrypto = require('nostale-cryptography/client')

const host = '<NosTale IP>'
const port = <NosTale Port>

const socket = net.connect(port, host, () => {
  const encryptStream = nosCrypto.createCipher()
  const decryptStream = nosCrypto.createDecipher()

  const encodingStream = iconv.encodeStream('win1252')
  const decodingStream = iconv.decodeStream('win1252')

  pipeline(
    encodingStream,
    encryptStream,
    socket,
    decryptStream,
    decodingStream,
    (err) => {
      if (err) {
        throw err
      }

      console.log('Game closed because stream pipeline closed.')
    }
  )

  buildLoginPacket().then((loginPacket) => {
    console.log(loginPacket)

    encodingStream.write(loginPacket)

    decodingStream.on('data', (packet) => {
      console.log(packet)

      // ...
      // Handle packet
      // ...
    })
  })
})

async function buildLoginPacket () {
  const nostalePath = 'C:\\Program Files (x86)\\NosTale_IT'
  const username = '<Your username>'
  const password = '<Your password>'

  const encodedUsername = iconv.encode(username, 'win1252')
  const encodedPassword = iconv.encode(password, 'win1252')

  const random = Math.floor(Math.random() * 9999999)
  const encryptedPassword = nosCrypto.encryptPassword(encodedPassword)
  const version = await nosCrypto.createVersion(nostalePath)
  const checksumHash = await nosCrypto.createChecksumHash(encodedUsername, nostalePath)

  return `NoS0575 ${random} ${username} ${encryptedPassword} ${version} 0 ${checksumHash}`
}

```
