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

contract('SkaraToken', function ([owner, wallet, investor]) {
    const START_BONUS = new BigNumber(15);

    const RATE = new BigNumber(500);
    const CAP  = ether(10);
    
    before(async function() {
      /*web3.personal.unlockAccount(owner,"password",15000); // unlock for a long time
      web3.personal.unlockAccount(wallet,"password",15000); // unlock for a long time
      web3.personal.unlockAccount(investor,"password",15000); // unlock for a long time
    */
      //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
      await advanceBlock()
    })
  
    beforeEach(async function () {

      //crowdsale
      this.startTime = latestTime() + duration.weeks(1);
      var _duration =  duration.years(3);
      this.endTime =   this.startTime + _duration;
      this.afterEndTime = this.endTime + duration.seconds(1);
  
      //vesting
      this.vestStart = this.startTime + duration.minutes(1); // +1 minute so it starts after contract instantiation
      this.vestDuration = duration.years(1);
      this.cliff = duration.days(90);
      this.vestEnd = this.vestStart + this.vestDuration + duration.seconds(1);
      this.crowdsale = await SkaraCrowdsale.new(CAP, this.startTime,  this.endTime, RATE, owner);
      this.token = SkaraToken.at(await this.crowdsale.token());

      //await this.token.mint(this.crowdsale.address, TOKEN_AMOUNT, { from: owner });
    });

    it('fail to transfer during cliff', async function () {
      const investment = new BigNumber(1);
      await increaseTimeTo(this.vestStart);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;

      console.log("buy");
      //const vbalance = await this.token.balanceOf(investor.address);
      //console.log("vbalance");
      const vesting = this.crowdsale.getVesting(investor);
      await vesting.release(this.token).should.be.rejectedWith(EVMRevert);
      console.log("release");
    });

    it('Allow transfer all tokens after vesting period', async function () {
      const investment = new BigNumber(1);
      await increaseTimeTo(this.vestEnd + duration.seconds(1));
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedVested = investment*RATE;
        
      await this.token.transfer(wallet, 1).should.be.fulfilled;
      
      //balance.should.be.bignumber.above(investment*RATE);
    });

    it('Transfer half tokens at week 12 vesting period', async function () {
      const investment = new BigNumber(1);
      const now = this.vestStart + this.cliff + duration.weeks(12);
      await increaseTimeTo(now);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedVested = (investment*RATE)*(now - this.vestStart)/(this.vestDuration).floor();
      await this.token.transfer(wallet, 1)
      //balance.should.be.bignumber.above(investment*RATE);
    });



});




/*
contract('SkaraVesting', function ([owner, wallet, investor]) {

  const RATE = new BigNumber(500);
  const CAP  = ether(1);
  const TOKEN_AMOUNT  = new BigNumber(1000);
  
  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    var _duration =   duration.weeks(1);
    this.endTime =   this.startTime + _duration;
    this.afterEndTime = this.endTime + duration.seconds(1);

    this.vestStart = this.startTime + duration.minutes(1); // +1 minute so it starts after contract instantiation
    this.cliff = duration.days(90);
    this.vestDuration = duration.years(1);
  
    this.vesting = await SkaraCrowdsale.new(CAP, this.startTime,  this.endTime, RATE, owner );
    //this.token = SkaraToken.at(await this.vesting.token());
    this.token = await SkaraToken.new({ from: owner });

    await this.token.mint(this.vesting.address, TOKEN_AMOUNT, { from: owner });
  });
    
  it('cannot be released before cliff', async function () {
    await this.vesting.release(this.token.address).should.be.rejectedWith(EVMRevert);
  });

  it('can be released after cliff', async function () {
    await increaseTimeTo(this.vestStart + this.cliff + duration.weeks(1));
    await this.vesting.release(this.token.address).should.be.fulfilled;
  });

  it('should release proper amount after cliff', async function () {
    await increaseTimeTo(this.vestStart + this.cliff);

    const { receipt } = await this.vesting.release(this.token.address);
    const releaseTime = web3.eth.getBlock(receipt.blockNumber).timestamp;

    const balance = await this.token.balanceOf(investor);
    balance.should.bignumber.equal(TOKEN_AMOUNT.mul(releaseTime - this.vestStart).div(this.vestDuration).floor());
  });

  it('should linearly release tokens during vesting period', async function () {
    const vestingPeriod = this.vestDuration - this.cliff;
    const checkpoints = 4;

    for (let i = 1; i <= checkpoints; i++) {
      const now = this.vestStart + this.cliff + i * (vestingPeriod / checkpoints);
      await increaseTimeTo(now);

      await this.vesting.release(this.token.address);
      const balance = await this.token.balanceOf(investor);
      const expectedVesting = TOKEN_AMOUNT.mul(now - this.vestStart).div(this.vestDuration).floor();

      balance.should.bignumber.equal(expectedVesting);
    }
  });

  it('should have released all after end', async function () {
    await increaseTimeTo(this.vestStart + this.vestDuration);
    await this.vesting.release(this.token.address);
    const balance = await this.token.balanceOf(investor);
    balance.should.bignumber.equal(TOKEN_AMOUNT);
  });

  /*
  it('should be revoked by owner if revocable is set', async function () {
    await this.vesting.revoke(this.token.address, { from: owner }).should.be.fulfilled;
  });

 it('should fail to be revoked by owner if revocable not set', async function () {
    const vesting = await TokenVesting.new(investor, this.vestStart, this.cliff, this.duration, false, { from: owner } );
    await vesting.revoke(this.token.address, { from: owner }).should.be.rejectedWith(EVMRevert);
  });

  it('should return the non-vested tokens when revoked by owner', async function () {
    await increaseTimeTo(this.vestStart + this.cliff + duration.weeks(12));

    const vested = await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    const ownerBalance = await this.token.balanceOf(owner);
    ownerBalance.should.bignumber.equal(TOKEN_AMOUNT.sub(vested));
  });

  it('should keep the vested tokens when revoked by owner', async function () {
    await increaseTimeTo(this.vestStart + this.cliff + duration.weeks(12));

    const vestedPre = await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    const vestedPost = await this.vesting.vestedAmount(this.token.address);

    vestedPre.should.bignumber.equal(vestedPost);
  });

  it('should fail to be revoked a second time', async function () {
    await increaseTimeTo(this.vestStart + this.cliff + duration.weeks(12));

    const vested = await this.vesting.vestedAmount(this.token.address);

    await this.vesting.revoke(this.token.address, { from: owner });

    await this.vesting.revoke(this.token.address, { from: owner }).should.be.rejectedWith(EVMRevert);
  });*/
