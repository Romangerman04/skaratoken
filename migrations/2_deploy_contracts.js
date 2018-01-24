const BigNumber = web3.BigNumber;

var SkaraCrowdsale = artifacts.require("SkaraCrowdsale");
var SkaraToken = artifacts.require("SkaraToken");

const EUR_PER_ETHER = 817.65

const cap  = web3.toWei(1, 'ether') * (10000000/EUR_PER_ETHER); // 10 M€ in wei at startTime
const presaleCap  = web3.toWei(1, 'ether')*(10000000/EUR_PER_ETHER); // 6 M€ in wei at startTime
const investmentLow  = new BigNumber(100); 
const investmentMedium  = new BigNumber(500); 
const investmentHigh  = new BigNumber(2000); 
const startTime = 1518048000  //02/08/2018 @ 3:00pm (UTC)
const endTime = 1519398000  //02/23/2018 @ 3:00pm (UTC)
const rate = new BigNumber(1000);
//const wallet = "0x627306090abab3a6e1400e9345bc60c78a8bef57"; //truffle develop Change on deploy
//const wallet = "0x0E56f09FDD14d61E456fbc45C618fD4FF10256e2"; //kovan Change on deploy
const wallet = "0x0E56f09FDD14d61E456fbc45C618fD4FF10256e2"; //testrpc Change on deploy

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
    wallet)
      .then(()=>{
        return SkaraCrowdsale.deployed()
          .then(crowdsale => {
            console.log("crowdsale", crowdsale.address);
            return crowdsale.token();
          })
          .then(token =>{
            console.log("token", token);
          })
      })
};

