const BigNumber = web3.BigNumber;

var SkaraCrowdsale = artifacts.require("SkaraCrowdsale");
var SkaraToken = artifacts.require("SkaraToken");


/** SETUP BEFORE DEPLOY!!!!! */
const EUR_PER_ETHER = 809.82 //average on deploy day (01/24/2018)
const wallet = "0x69F28b7e90285E25E79ff3372dfe69F1fE8D7605"; //skara

const cap  = web3.toWei(1, 'ether') * (10000000/EUR_PER_ETHER); // 10 M€ in wei at startTime
const presaleCap  = web3.toWei(1, 'ether')*(6000000/EUR_PER_ETHER); // 6 M€ in wei at startTime
const investmentLow  = web3.toWei(100, 'ether'); 
const investmentMedium  = web3.toWei(500, 'ether'); 
const investmentHigh  = web3.toWei(2000, 'ether'); 
const startTime = 1518102000  //02/08/2018 @ 3:00pm (UTC)
const endTime = 1519398000  //02/23/2018 @ 3:00pm (UTC)
const rate = new BigNumber(1000);

//const wallet = "0x627306090abab3a6e1400e9345bc60c78a8bef57"; //truffle develop Change on deploy
//const wallet = "0x0E56f09FDD14d61E456fbc45C618fD4FF10256e2"; //kovan Change on deploy
//const wallet = "0x0E56f09FDD14d61E456fbc45C618fD4FF10256e2"; //testrpc Change on deploy
//const wallet = "0x69F28b7e90285E25E79ff3372dfe69F1fE8D7605"; //skara

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

