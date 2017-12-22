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

const BonificatedCrowdsale = artifacts.require('BonificatedCrowdsaleTest');
const SkaraToken = artifacts.require('SkaraToken');

contract('BonificatedCrowdsale', function ([owner, wallet, investor]) {
    const START_BONUS = new BigNumber(15);

    const RATE = new BigNumber(500);
    const CAP  = ether(1);
    
    before(async function() {
      //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
      await advanceBlock()
    })
  
    beforeEach(async function () {

      //crowdsale
      this.startTime = latestTime() + duration.weeks(1);
      var _duration =  duration.weeks(1);
      this.endTime =   this.startTime + _duration;
      this.afterEndTime = this.endTime + duration.seconds(1);
  
      //bonus
      this.bonusStart = this.startTime + duration.minutes(1); // +1 minute so it starts after contract instantiation
      this.bonusDuration = duration.days(3);
      this.afterBonusEnd = this.bonusStart + this.bonusDuration + duration.seconds(1);
    
      this.crowdsale = await BonificatedCrowdsale.new(this.startTime,  this.endTime, RATE, owner, this.bonusStart, this.bonusDuration, START_BONUS );
      this.token = SkaraToken.at(await this.crowdsale.token());

      //await this.token.mint(this.crowdsale.address, TOKEN_AMOUNT, { from: owner });
    });

    it('purchase on start bonus period', async function () {
      const investment = new BigNumber(1);
      await increaseTimeTo(this.bonusStart);
      const bonus = await this.crowdsale.getBonus(investor);
      console.log("Current Bonus:", bonus);
      const tokensReceived = await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.above(investment*RATE);

      console.log("Token Purchase ->","investment (ETH):", investment ,"after:", balance, "(SKA)");
    });

    it('purchase during bonus period', async function () {
      const investment = new BigNumber(1);
      await increaseTimeTo(this.bonusStart + this.bonusDuration/2);
      const bonus = await this.crowdsale.getBonus(investor);
      console.log("Current Bonus:", bonus);
      const tokensReceived = await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.above(investment*RATE);

      console.log("Token Purchase ->","investment (ETH):", investment ,"after:", balance, "(SKA)");
    });

    it('purchase after bonus period', async function () {
      const investment = new BigNumber(1);
      await increaseTimeTo(this.afterBonusEnd);
      const bonus = await this.crowdsale.getBonus(investor);
      console.log("Current Bonus:", bonus);
      const tokensReceived = await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
     
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(investment*RATE);
     
      console.log("Token Purchase ->","investment (ETH):", investment ,"after:", balance, "(SKA)");
      
    });

    it('add user with custom bonus', async function () {
      await increaseTimeTo(this.bonusStart + this.bonusDuration/2);

      const customBonus = new BigNumber(27);
      await this.crowdsale.addCustomBonus(investor, customBonus, {from: owner});
      
      const bonus = await this.crowdsale.getBonus(investor);

      bonus.should.be.bignumber.equal = customBonus;
    });

    it('purchase with custom bonus during bonus period', async function () {
      const investment = new BigNumber(1);
      await increaseTimeTo(this.bonusStart + this.bonusDuration/2);
      await this.crowdsale.addCustomBonus(investor, 22, {from: owner});

      const bonus = await this.crowdsale.getBonus(investor);
      console.log("Current Bonus:", bonus);
      const tokensReceived = await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
     
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(investment*RATE*(1 + bonus/10000));
     
      console.log("Token Purchase ->","investment (ETH):", investment ,"after:", balance, "(SKA)");
      
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
