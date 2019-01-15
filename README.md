# multi-privatekey-provider

## truffle.js example
```js
const MultyPrivateKeyProvider = require('multi-privatekey-provider');

const config = {
  networks: {
    production: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    },
    custom: {
      provider: new MultyPrivateKeyProvider('./pkeys.yaml', 'http://localhost:8545'),
      network_id: '*',
    },
  }
};

module.exports = config;

```