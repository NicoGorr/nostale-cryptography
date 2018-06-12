# NosTale Cryptography

The NosTale Client, Server and Archive cryptographic algorithms for Node.js.

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

// To get the Login Crypto you must pass nothing.
const encryptLoginStream = nosCrypto.createCipher()
const decryptLoginStream = nosCrypto.createDecipher()

// To get the World Crypto you must pass the session number.
const encryptWorldStream = nosCrypto.createCipher(session)
const decryptWorldStream = nosCrypto.createDecipher(session)

const encryptedSession = nosCrypto.encryptSession(session)

const encryptedPassword = nosCrypto.encryptPassword(password) // NosTale Gameforge
const encryptedPasswordLegacy = nosCrypto.encryptPasswordLegacy(password) // NosTale Vendetta

const version = nosCrypto.createVersion(nostalePath)

const checksumHash = nosCrypto.createChecksumHash(username, nostalePath) // Returns a Promise
```