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

// To get the Login Crypto you must pass nothing.
const encryptLoginStream = crypto.createCipher()
const decryptLoginStream = crypto.createCipher()

// To get the World Crypto you must pass the session number.
const encryptWorldStream = crypto.createCipher(session)
const decryptWorldStream = crypto.createCipher(session)

const encryptedSession = crypto.encryptSession(session)

const encryptedPassword = crypto.encryptPassword(password) // NosTale Gameforge
const encryptedPasswordLegacy = crypto.encryptPasswordLegacy(password) // NosTale Vendetta

const version = crypto.createVersion(nostalePath)

const checksumHash = crypto.createChecksumHash(username, nostalePath) // Returns a Promise
```