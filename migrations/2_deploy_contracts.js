const BigNumber = web3.BigNumber;

var SkaraCrowdsale = artifacts.require("SkaraCrowdsale");

const EUR_PER_ETHER = 817.65

const cap  = 10000000/EUR_PER_ETHER; // 10 M€ on ETH at startTime
const presaleCap  = 6000000/EUR_PER_ETHER; // 6 M€ on ETH at startTime
const investmentLow  = new BigNumber(100); 
const investmentMedium  = new BigNumber(500); 
const investmentHigh  = new BigNumber(2000); 
const startTime = 1518048000  //02/08/2018 @ 3:00pm (UTC)
const endTime = 1519398000  //02/23/2018 @ 3:00pm (UTC)
const rate = new BigNumber(1000);
const wallet = "0x627306090abab3a6e1400e9345bc60c78a8bef57"; //JUST DEVELOPMENT!!! Change on deploy

module.exports = function(deployer) {
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

