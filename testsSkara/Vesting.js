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
const TokenVesting = artifacts.require('TokenVesting');

contract('Vesting', function ([owner, presaler, unreleaser, halfreleaser, fullreleaser]) {
  const RATE = new BigNumber(10);
  const CAP  = ether(100);

  const PRE_SALER_DURATION = duration.weeks(24);

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()

    this.beforeStart = latestTime() + duration.minutes(1);
    this.startTime = this.beforeStart + duration.weeks(2);
    var _duration =   duration.weeks(4);
    this.endTime =   this.startTime + _duration;
    this.afterEndTime = this.endTime + duration.seconds(1);
    
    this.vestingStart = this.endTime;
    this.vestingCliff = duration.weeks(12);
    
    this.crowdsale = await SkaraCrowdsale.new(CAP, this.startTime,  this.endTime, RATE, owner, {from: owner});
    this.token = await SkaraToken.at(await this.crowdsale.token());
  })

  beforeEach(async function () {

    this.beforeStart = latestTime() + duration.minutes(1);
    this.startTime = this.beforeStart + duration.weeks(2);
    var _duration =   duration.weeks(4);
    this.endTime =   this.startTime + _duration;
    this.afterEndTime = this.endTime + duration.seconds(1);
    
    this.vestingStart = this.endTime;
    this.vestingCliff = duration.weeks(12);
    
    this.crowdsale = await SkaraCrowdsale.new(CAP, this.startTime,  this.endTime, RATE, owner, {from: owner});
    this.token = await SkaraToken.at(await this.crowdsale.token());
  });

  it('add presaler before crowsale start', async function () {
    const investment = ether(1);
    await increaseTimeTo(latestTime() );
    await this.crowdsale.setupPresaler(presaler, investment, PRE_SALER_DURATION, 0, {from:owner}).should.be.fulfilled;
  });

  it('reject add presaler from no owner', async function () {
    const investment = ether(1);
    await increaseTimeTo(latestTime() );
    await this.crowdsale.setupPresaler(presaler, investment, PRE_SALER_DURATION, 0, {from:presaler}).should.be.rejectedWith(EVMRevert);
  });

  it('allow purchase for presaler within boundaries before crowsale start', async function () {
    await increaseTimeTo(this.beforeStart);
    const investment = ether(1);

    await this.crowdsale.setupPresaler(presaler, investment, PRE_SALER_DURATION, 0, {from:owner}).should.be.fulfilled;

    await this.crowdsale.buyTokens(presaler, {value: investment, from:presaler}).should.be.fulfilled;
    const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);

    const vestingBalance = await this.token.balanceOf(vestingContractAddress);
    vestingBalance.should.be.bignumber.equal(investment*RATE);
  });
  
  it('reject purchase for non presaler before crowsale start', async function () {
    
    await increaseTimeTo(this.beforeStart);
    const investment = ether(1);
    const boundary = await this.crowdsale.getPresaleBoundary(presaler);
    await this.crowdsale.buyTokens(presaler,  {value: investment, from:presaler}).should.be.rejectedWith(EVMRevert);
  });

  
  it('allow total release after vesting', async function () {
    await increaseTimeTo(this.beforeStart);
    const investment = ether(1);

    await this.crowdsale.setupPresaler(presaler, investment, PRE_SALER_DURATION, 0, {from:owner}).should.be.fulfilled;
    await this.crowdsale.buyTokens(presaler, {value: investment, from:presaler}).should.be.fulfilled;
    const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);
    
    await increaseTimeTo(this.vestingStart + PRE_SALER_DURATION);
    
    const vestingContract = await TokenVesting.at(vestingContractAddress);
    await vestingContract.release(this.token.address, {form:presaler});
       
    const vestingBalance = await this.token.balanceOf(vestingContractAddress);
    const presealerBalance = await this.token.balanceOf(presaler);

    vestingBalance.should.be.bignumber.equal(0);
    presealerBalance.should.be.bignumber.equal(investment*RATE);

  });

  it('allow partial release after cliff but before vesting end', async function () {
    await increaseTimeTo(this.beforeStart);
    const investment = ether(10);

    await this.crowdsale.setupPresaler(presaler, investment, PRE_SALER_DURATION, 0, {from:owner}).should.be.fulfilled;
   
    await this.crowdsale.buyTokens(presaler, {value: investment, from:presaler}).should.be.fulfilled;
    const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);
            
    const now = this.vestingStart + this.vestingCliff;
    await increaseTimeTo(now);
    
    const vestingContract = await TokenVesting.at(vestingContractAddress);
    await vestingContract.release(this.token.address, {form:presaler});
    
    const vestingBalance = await this.token.balanceOf(vestingContractAddress);
    const presealerBalance = await this.token.balanceOf(presaler);

    vestingBalance.should.be.bignumber.below(investment*RATE);
    presealerBalance.should.be.bignumber.below(investment*RATE);
    (vestingBalance.add(presealerBalance)).should.be.bignumber.equal(investment*RATE);
  
  });

  it('inspectable vestings through webapp', async function () {
    
    await increaseTimeTo(this.beforeStart);
    const investment = ether(10);

    await this.crowdsale.setupPresaler(unreleaser, investment, PRE_SALER_DURATION, 0, {from:owner}).should.be.fulfilled;
    await this.crowdsale.setupPresaler(halfreleaser, investment.add(ether(2)), 2*PRE_SALER_DURATION, 0, {from:owner}).should.be.fulfilled;
    await this.crowdsale.setupPresaler(fullreleaser, investment.add(ether(4)), PRE_SALER_DURATION, 0, {from:owner}).should.be.fulfilled;
   
    await this.crowdsale.buyTokens(unreleaser, {value: investment, from:unreleaser}).should.be.fulfilled;
    await this.crowdsale.buyTokens(halfreleaser, {value: investment.add(ether(2)), from:halfreleaser}).should.be.fulfilled;
    await this.crowdsale.buyTokens(fullreleaser, {value: investment.add(ether(4)) , from:fullreleaser}).should.be.fulfilled;

    const unreleaserVestingContractAddress = await this.crowdsale.getVestingAddress(unreleaser);
    const halfreleaserVestingContractAddress = await this.crowdsale.getVestingAddress(halfreleaser);
    const fullreleaserVestingContractAddress = await this.crowdsale.getVestingAddress(fullreleaser);
    
    const unreleaserVestingContract = await TokenVesting.at(unreleaserVestingContractAddress);
    const halfreleaserVestingContract = await TokenVesting.at(halfreleaserVestingContractAddress);
    const fullreleaserVestingContract = await TokenVesting.at(fullreleaserVestingContractAddress);
   
    const now = this.vestingStart + PRE_SALER_DURATION;
    await increaseTimeTo(now);
    await halfreleaserVestingContract.release(this.token.address, {from:halfreleaser});
    await fullreleaserVestingContract.release(this.token.address, {from:fullreleaser});

    console.log("Ureleased url:", "http://localhost:3000/" + unreleaserVestingContractAddress + "/" + this.token.address);
    console.log("Half released url:", "http://localhost:3000/" + halfreleaserVestingContractAddress + "/" + this.token.address);
    console.log("Full released url:", "http://localhost:3000/" + fullreleaserVestingContractAddress + "/" + this.token.address);
  });

 });

