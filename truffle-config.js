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
      gas: 6721975,

    },
    ropsten: {
      network_id: 3,
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/")
      },
      gas: 3000000,
    },
    
    kovan: {
      network_id: 42,
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://kovan.infura.io/")
      },
      gas: 6721975,
      gasPrice: 20000000
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },

    main: {
      network_id: 1,
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://mainnet.infura.io/ ")
      },
      gas: 6721975,
      gasPrice: 10000000000
    },
    
  },
  solc: { optimizer: { enabled: true, runs: 200 } }
  
  
};

