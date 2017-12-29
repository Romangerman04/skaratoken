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

contract('FinalAllocation', function ([owner, investor]) {
  const RATE = new BigNumber(10);
  const CAP  = ether(100);
  const SALE_ALLOCATION_PERCENTAGE  = 63;
  const FINAL_ALLOCATION_PERCENTAGE  = 37;

  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {

    this.startTime = latestTime() + duration.weeks(2);
    var _duration =   duration.weeks(4);
    this.endTime =   this.startTime + _duration;
    this.afterEndTime = this.endTime + duration.seconds(1);
    
    this.whitelistStart = this.startTime + duration.minutes(1); // +1 minute so it starts after contract instantiation
    this.whitelistDayTwoStart = this.whitelistStart + duration.days(1);
    this.whitelistEnd = this.whitelistStart + duration.days(2);

    this.crowdsale = await SkaraCrowdsale.new(CAP, this.startTime,  this.endTime, RATE, owner, {from: owner});
    this.token = await SkaraToken.at(await this.crowdsale.token());
  });

  it('reject token creation before sale ends', async function () {
    await increaseTimeTo(this.startTime);
    await this.crowdsale.finalize().should.be.rejectedWith(EVMRevert);
  });

  it('accept token creation after sale ends', async function () {
    await increaseTimeTo(this.afterEndTime);
    await this.crowdsale.finalize({from:owner}).should.be.fulfilled;
  });
  
  it('create the correct amount of tokens', async function () {
    await increaseTimeTo(this.whitelistEnd + duration.days(2)); //after bonus

    const investment = ether(10);
    await this.crowdsale.buyTokens(investor, {value:investment, from: investor}).should.be.fulfilled;

    await increaseTimeTo(this.afterEndTime);

    const totalSale = await this.token.totalSupply();
    const total = totalSale.mul(100).div(SALE_ALLOCATION_PERCENTAGE);
    const expectedFinalAlocation = (total.mul(FINAL_ALLOCATION_PERCENTAGE).div(100)).floor();

    await this.crowdsale.finalize({from:owner}).should.be.fulfilled;
    
    const crowdsaleBalance = await this.token.balanceOf(this.crowdsale.address);
    crowdsaleBalance.should.be.bignumber.equal(expectedFinalAlocation);
  });
 
 });

