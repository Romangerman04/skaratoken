require('babel-register');
require('babel-polyfill');

var provider;
var HDWalletProvider = require('truffle-hdwallet-provider');
var mnemonic = '[REDACTED]';

if (!process.env.SOLIDITY_COVERAGE){
  provider = new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/')
}


module.exports = {
  networks: {

    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 6712390,
      from: "0x627306090abab3a6e1400e9345bc60c78a8bef57",
      //from: "0x13ba42b19c25c0f6ecb7ab1c5db8d736231ecb94",
    },
    ropsten: {
      provider: provider,
      network_id: 3 // official id of the ropsten network
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    
  },
  solc: { optimizer: { enabled: true, runs: 200 } }
  
  
};

