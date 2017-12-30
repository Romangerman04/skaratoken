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

contract('Whitelist', function ([owner, wallet, investor]) {
  const RATE = new BigNumber(500);
  const CAP  = ether(10);

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

  it('should create crowdsale with correct parameters', async function () {
    this.crowdsale.should.exist;
    this.token.should.exist;

    (await this.crowdsale.startTime()).should.be.bignumber.equal(this.startTime);
    (await this.crowdsale.endTime()).should.be.bignumber.equal(this.endTime);
    (await this.crowdsale.rate()).should.be.bignumber.equal(RATE);
    (await this.crowdsale.owner()).should.be.equal(owner);
    (await this.crowdsale.cap()).should.be.bignumber.equal(CAP);
  });

  it('should not accept payments from non whitelisted', async function () {
    await increaseTimeTo(this.whitelistStart);
    await this.crowdsale.send(ether(1), {from: wallet}).should.be.rejectedWith(EVMRevert);
    await this.crowdsale.buyTokens(investor, {from: wallet, value: ether(1)}).should.be.rejectedWith(EVMRevert);
  });
  
  it('add investor to day one whitelist', async function () {
    const boundary = ether(1);

    await increaseTimeTo(this.whitelistStart);
    await this.crowdsale.addToDayOne(investor, boundary, {from: owner}).should.be.fulfilled;

  });

  it('add investor to day two whitelist', async function () {
    const boundary = ether(1);

    await increaseTimeTo(this.whitelistStart);
    await this.crowdsale.addToDayTwo(investor, {from: owner}).should.be.fulfilled;
  });

  it('accept payments within boundaries from whitelisted on day one ', async function () {
    const boundary = ether(2);
    await this.crowdsale.addToDayOne(investor, boundary, {from: owner}).should.be.fulfilled;

    await increaseTimeTo(this.whitelistStart);
    const investment = boundary - ether(1);
    await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
  });

  it('reject payments outside boundaries from whitelisted on day one ', async function () {
    const boundary = ether(1);

    await this.crowdsale.addToDayOne(investor, boundary, {from: owner}).should.be.fulfilled;
    await increaseTimeTo(this.whitelistStart);
    
    const investment = ether(2);
    await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.rejectedWith(EVMRevert);

  });

  it('accept payments outside boundaries from whitelisted on day two ', async function () {
    const boundary = ether(1);
    await this.crowdsale.addToDayOne(investor, boundary, {from: owner}).should.be.fulfilled;
    
    const investment =  ether(10);
    await increaseTimeTo(this.whitelistDayTwoStart + duration.minutes(1));
    await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;

  });

  it('accept payments from automatically whitelisted on day two if purchased on day one', async function () {
    const boundary = ether(1);
    await this.crowdsale.addToDayOne(investor, boundary, {from: owner}).should.be.fulfilled;
    
    await increaseTimeTo(this.whitelistStart);
    const investment =  ether(1);
    await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
    
    await increaseTimeTo(this.whitelistDayTwoStart + duration.minutes(1));
    const dayTwoinvestment = ether(2);
    await this.crowdsale.buyTokens(investor, {value: dayTwoinvestment, from: investor}).should.be.fulfilled;
   
  });
 });

