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

contract('Vesting', function ([owner, presaler, bounty, team, someone]) {
  const RATE = new BigNumber(10);
  const CAP  = ether(10);

  const PRE_SALER_DURATION = duration.weeks(36);

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {

    this.startTime = latestTime() + duration.weeks(2);
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
    await this.crowdsale.setupPresaler(presaler, investment, PRE_SALER_DURATION).should.be.fulfilled;
  });

  it('allow purchase for presaler within boundaries before crowsale start', async function () {
    await increaseTimeTo(latestTime());
    const investment = ether(1);

    await this.crowdsale.setupPresaler(presaler, investment, PRE_SALER_DURATION).should.be.fulfilled;

    await this.crowdsale.buyTokens(presaler, {value: investment, from:presaler}).should.be.fulfilled;
    const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);

    const vestingBalance = await this.token.balanceOf(vestingContractAddress);
    vestingBalance.should.be.bignumber.equal(investment*RATE);
  });
  
  it('reject purchase for non presaler before crowsale start', async function () {
    
    await increaseTimeTo(latestTime());
    const investment = ether(1);
    const boundary = await this.crowdsale.getPresaleBoundary(presaler);
    await this.crowdsale.buyTokens(presaler,  {value: investment, from:presaler}).should.be.rejectedWith(EVMRevert);
  });

  it('allow partial release during vesting', async function () {
    await increaseTimeTo(latestTime());
    const investment = ether(1);

    await this.crowdsale.setupPresaler(presaler, investment, PRE_SALER_DURATION).should.be.fulfilled;
   
    await this.crowdsale.buyTokens(presaler, {value: investment, from:presaler}).should.be.fulfilled;
    const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);
    console.log("url:", "http://localhost:3000/" + vestingContractAddress + "/" + this.token.address);

    const now = this.vestingStart + PRE_SALER_DURATION/2;
    await increaseTimeTo(now);
    
    const vestingContract = await TokenVesting.at(vestingContractAddress);
    await vestingContract.release(this.token.address, {form:presaler});

    const vestingBalance = await this.token.balanceOf(vestingContractAddress);
    const presealerBalance = await this.token.balanceOf(presaler);

    console.log("vesting balance", vestingBalance);
    console.log("presaler balance", presealerBalance);

    vestingBalance.should.be.bignumber.below(investment*RATE);
    presealerBalance.should.be.bignumber.below(investment*RATE);
    (vestingBalance.add(presealerBalance)).should.be.bignumber.equal(investment*RATE);
  
  });

  it('allow total release after vesting', async function () {
    await increaseTimeTo(latestTime());
    const investment = ether(1);

    await this.crowdsale.setupPresaler(presaler, investment, PRE_SALER_DURATION).should.be.fulfilled;
    await this.crowdsale.buyTokens(presaler, {value: investment, from:presaler}).should.be.fulfilled;
    const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);
    console.log("url:", "http://localhost:3000/" + vestingContractAddress + "/" + this.token.address);
    
    await increaseTimeTo(this.vestingStart + PRE_SALER_DURATION);
    
    const vestingContract = await TokenVesting.at(vestingContractAddress);
    await vestingContract.release(this.token.address, {form:presaler});
    
    const vestingBalance = await this.token.balanceOf(vestingContractAddress);
    const presealerBalance = await this.token.balanceOf(presaler);

    console.log("vesting balance", vestingBalance);
    console.log("presaler balance", presealerBalance);

    vestingBalance.should.be.bignumber.equal(0);
    presealerBalance.should.be.bignumber.equal(investment*RATE);
  });
 });

