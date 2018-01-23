require('babel-register');
require('babel-polyfill');
var fs = require('fs');

var provider;
var HDWalletProvider = require('truffle-hdwallet-provider');
 'spatial destroy sure stamp blossom want glove budget crater correct toss deal';

 var mnemonic = fs.readFileSync('./_seed/seed.txt', 'utf8');

if (!process.env.SOLIDITY_COVERAGE){
  provider = new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/')
}


module.exports = {
  networks: {

    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 3000000,
      from: "0x627306090abab3a6e1400e9345bc60c78a8bef57",
      //from: "0x13ba42b19c25c0f6ecb7ab1c5db8d736231ecb94",
    },
    ropsten: {
      network_id: 3,
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/pv0QcsGlqWaGaZvEsP9i")
      },
      gas: 3000000,
      from: "0x0E56f09FDD14d61E456fbc45C618fD4FF10256e2"
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

