import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMRevert from './helpers/EVMRevert'

const BigNumber = web3.BigNumber;

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const SkaraCrowdsale = artifacts.require('SkaraCrowdsale');
const SkaraToken = artifacts.require('SkaraToken');

contract('SkaraCrowdsale', function ([owner, wallet, investor]) {
  const RATE = new BigNumber(500);
  const CAP  = ether(10);

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    var _duration =   duration.weeks(4);
    this.endTime =   this.startTime + _duration;
    this.afterEndTime = this.endTime + duration.seconds(1);

    this.vestStart = this.startTime + duration.minutes(1); // +1 minute so it starts after contract instantiation
    this.cliff = duration.days(90);
    this.vestDuration = duration.years(1);
  
    this.crowdsale = await SkaraCrowdsale.new(CAP, this.startTime,  this.endTime, RATE, owner , {from:owner});
    this.token = await SkaraToken.at(await this.crowdsale.token());

    //console.log("token owner", await this.token.owner());
    //await this.token.mint(this.crowdsale.address, 10000, { from: owner });
  });

  it('should create crowdsale with correct parameters', async function () {
    this.crowdsale.should.exist;
    this.token.should.exist;

    (await this.crowdsale.startTime()).should.be.bignumber.equal(this.startTime);
    (await this.crowdsale.endTime()).should.be.bignumber.equal(this.endTime);
    (await this.crowdsale.rate()).should.be.bignumber.equal(RATE);
    (await this.crowdsale.owner()).should.be.equal(owner);
    (await this.crowdsale.cap()).should.be.bignumber.equal(CAP);
  });

  it('should not accept payments before start', async function () {
    await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMRevert);
    await this.crowdsale.buyTokens(investor, {from: investor, value: ether(1)}).should.be.rejectedWith(EVMRevert);
  });

  
  it('should accept payments during the sale', async function () {
    const investment = ether(1);
    const expectedTokenAmount = RATE.mul(investment);

    await increaseTimeTo(this.startTime);
    await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;

    //(await this.token.balanceOf(investor)).should.be.bignumber.at.least(expectedTokenAmount);
    (await this.token.totalSupply()).should.be.bignumber.at.least(expectedTokenAmount);
  });

  it('should reject payments after end', async function () {
    await increaseTimeTo(this.afterEnd);
    await this.crowdsale.send(ether(1)).should.be.rejectedWith(EVMRevert);
    await this.crowdsale.buyTokens(investor, {value: ether(1), from: investor}).should.be.rejectedWith(EVMRevert);
  });

 });

 
 contract('Vesting', function ([o, owner, wallet, investor]) {
     const CAP  = ether(10);
     const RATE = new BigNumber(500);
     
     before(async function() {
       //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
       await advanceBlock()
     })
   
     beforeEach(async function () {
 
       //crowdsale
       this.startTime = latestTime() + duration.weeks(1);
       var _duration =  duration.weeks(4);
       this.endTime =   this.startTime + _duration;
       this.afterEndTime = this.endTime + duration.seconds(1);
   
       //vesting
       this.vestStart = this.startTime + duration.minutes(1); // +1 minute so it starts after contract instantiation
       this.vestDuration = duration.years(1);
       this.cliff = duration.days(90);
       this.vestEnd = this.vestStart + this.vestDuration;
       
       this.vesting = await SkaraCrowdsale.new(CAP, this.startTime,  this.endTime, RATE, owner ,{from: owner});
       this.token = SkaraToken.at(await this.vesting.token());
     
     });
 
     it('fail to release during cliff', async function () {
       const investment = ether(1);
       await increaseTimeTo(this.vestStart);
       await this.vesting.buyTokens(investor, {value: investment, from: investor})
       await this.vesting.release(investor).should.be.rejectedWith(EVMRevert);
     });
 
     
     it('Allow release all tokens after vesting period', async function () {
       const investment = ether(1);
       await increaseTimeTo(this.startTime);
       await this.vesting.buyTokens(investor, {value: investment, from: investor});

       await increaseTimeTo(this.vestEnd + duration.seconds(1));
 
       const vested = await this.vesting.vestedAmount(investor);
       const releasable = await this.vesting.releasableAmount(investor);
 
       //console.log("vested&releasable", vested, releasable);
       const prevBalance = await this.token.balanceOf(investor);
       
       await this.vesting.release(investor).should.be.fulfilled;
       const balance = await this.token.balanceOf(investor);
       await balance.should.be.bignumber.above(prevBalance);
     });
 
     
     it('release half tokens at week 12 vesting period', async function () {
       const investment = ether(1);
       await increaseTimeTo(this.startTime);
       await this.vesting.buyTokens(investor, {value: investment, from: owner});

       const now = this.vestStart + this.cliff + duration.weeks(12);
       await increaseTimeTo(now);
    
       const vested = await this.vesting.vestedAmount(investor);
       const releasable = await this.vesting.releasableAmount(investor);
       
       //console.log("vested&releasable", vested, releasable);
       const prevBalance = await this.token.balanceOf(investor);
       
       await this.vesting.release(investor).should.be.fulfilled;
       const balance = await this.token.balanceOf(investor);
       await balance.should.be.bignumber.above(prevBalance);
     });
     
 
     
 
 });


 contract('Capped', function ([owner, wallet, investor]) {
  const RATE = new BigNumber(500);
  const CAP  = ether(10);

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    var _duration =   duration.weeks(4);
    this.endTime =   this.startTime + _duration;
    this.afterEndTime = this.endTime + duration.seconds(1);

    this.vestStart = this.startTime + duration.minutes(1); // +1 minute so it starts after contract instantiation
    this.cliff = duration.days(90);
    this.vestDuration = duration.years(1);
  
    this.crowdsale = await SkaraCrowdsale.new(CAP, this.startTime,  this.endTime, RATE, owner , {from:owner});
    this.token = await SkaraToken.at(await this.crowdsale.token());

    //console.log("token owner", await this.token.owner());
    //await this.token.mint(this.crowdsale.address, 10000, { from: owner });
  });

  it('should reject payments over cap', async function () {
    await increaseTimeTo(this.startTime);
    await this.crowdsale.send(CAP);
    await this.crowdsale.send(1).should.be.rejectedWith(EVMRevert);
  });
 });