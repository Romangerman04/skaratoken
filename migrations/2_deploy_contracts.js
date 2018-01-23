const BigNumber = web3.BigNumber;

var SkaraCrowdsale = artifacts.require("SkaraCrowdsale");

const cap  = 10000000*1000; // 10 M€ on ETH at startTime
const presaleCap  = 6000000*1000; // 6 M€ on ETH at startTime
const investmentLow  = new BigNumber(100); 
const investmentMedium  = new BigNumber(500); 
const investmentHigh  = new BigNumber(2000); 
const startTime = 1518048000  //02/08/2018 @ 3:00pm (UTC)
const endTime = 1519398000  //02/23/2018 @ 3:00pm (UTC)
const rate = new BigNumber(1000);
//const wallet = "0x0E56f09FDD14d61E456fbc45C618fD4FF10256e2";
const wallet = "0x627306090abab3a6e1400e9345bc60c78a8bef57";
//const wallet = "0x13ba42b19c25c0f6ecb7ab1c5db8d736231ecb94";

module.exports = function(deployer) {
  //deployer.deploy(SkaraCrowdsale, [cap, startTime, endTime, rate, wallet], {gas: 4700000});
  deployer.deploy(
    SkaraCrowdsale,
    cap, 
    presaleCap, 
    investmentLow, 
    investmentMedium, 
    startTime, 
    endTime, 
    rate, 
    wallet);
};

