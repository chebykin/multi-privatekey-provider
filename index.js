// Inspired by https://github.com/nosuchip/truffle-privatekey-provider

const ProviderEngine = require('web3-provider-engine');
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
const HookedWalletEthTxSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js');
const ProviderSubprovider = require('web3-provider-engine/subproviders/provider.js');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const EthereumjsWallet = require('ethereumjs-wallet');
const Web3 = require('web3');
const YAML = require('yamljs');
const { inherits } = require('util');

function MultiPrivateKeyProvider(privateKeyFile, providerUrl) {
  if (!providerUrl) {
    throw new Error(`Provider URL missing, non-empty string expected, got "${providerUrl}"`);
  }

  this.engine = new ProviderEngine();

  this.engine.addProvider(new FiltersSubprovider());
  this.engine.addProvider(new NonceSubprovider());

  this.engine.addProvider(new MultiWalletSubprovider(privateKeyFile));

  // HACK: `sendAsync` was removed
  if (!Web3.providers.HttpProvider.prototype.sendAsync) {
    Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
  }

  this.engine.addProvider(new ProviderSubprovider(new Web3.providers.HttpProvider(providerUrl)));
  this.engine.start();
}

MultiPrivateKeyProvider.prototype.sendAsync = function() {
  this.engine.sendAsync.apply(this.engine, arguments);
};

MultiPrivateKeyProvider.prototype.send = function() {
  return this.engine.send.apply(this.engine, arguments);
};

inherits(MultiWalletSubprovider, HookedWalletEthTxSubprovider);

function MultiWalletSubprovider(privateKeysFile, opts = {}) {
  const addressList = [];
  const wallets = {};

  const privates = YAML.load(privateKeysFile);

  if (privates.length === 0) {
    throw new Error(`Failed loading private keys file`);
  }

  console.log('pkeys', privates);
  for (let i = 0; i < privates.length; i++) {
    const wallet = EthereumjsWallet.fromPrivateKey(Buffer.from(privates[i], 'hex'));
    const address = `0x${wallet.getAddress().toString('hex')}`;
    console.log("Pkey is ", privates[i], 'address is', address);

    addressList.push(address);
    wallets[address] = wallet;
  }

  opts.getAccounts = function(cb) {
    cb(null, addressList);
  };

  opts.getAccounts = function(cb) {
    cb(null, addressList);
  };

  opts.getPrivateKey = function(address, cb) {
    if (!(address in wallets)) {
      return cb('Account not found');
    }

    cb(null, wallets[address].getPrivateKey());
  };

  MultiWalletSubprovider.super_.call(this, opts);
}

module.exports = MultiPrivateKeyProvider;
