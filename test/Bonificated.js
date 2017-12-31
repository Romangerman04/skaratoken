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

contract('Bonificated', function ([owner, investor, presaler]) {
    const START_BONUS = new BigNumber(15);

    const RATE = new BigNumber(10);
    const CAP  = ether(10);
    
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
     
      this.whitelistStart = this.startTime + duration.minutes(1); // +1 minute so it starts after contract instantiation
      this.whitelistDayTwoStart = this.whitelistStart + duration.days(1);
      this.whitelistEnd = this.whitelistStart + duration.days(2);

      //bonus
      this.bonusStart = this.whitelistStart;
      this.openBonusStart = this.whitelistEnd; 
      this.bonusDuration = duration.days(3);
      this.afterBonusEnd = this.bonusStart + this.bonusDuration + duration.seconds(1);
    
      this.crowdsale = await SkaraCrowdsale.new(CAP, this.startTime,  this.endTime, RATE, owner, {from: owner});
      this.token = await SkaraToken.at(await this.crowdsale.token());

    });

    it('purchase on presale with custom bonus', async function () {
      const investment = ether(1);
      const customBonus = 21;
      const vestingDuration = duration.weeks(48);
      
      await this.crowdsale.setupPresaler(presaler, investment, vestingDuration, customBonus, {from:owner}).should.be.fulfilled;
      
      const tokensNoBonus = investment*RATE;
      
      const bonus = await this.crowdsale.getBonus(presaler);
      await this.crowdsale.buyTokens(presaler, {value: investment, from: presaler}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/10000);

      const vestingContractAddress = await this.crowdsale.getVestingAddress(presaler);
      const balance = await this.token.balanceOf(vestingContractAddress);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    });

    it('purchase on whitelist bonus period: day one', async function () {
      
      const investment = ether(1);
      await this.crowdsale.addToDayOne(investor, investment, {from: owner}).should.be.fulfilled;
      
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistStart);
      
      const bonus = await this.crowdsale.getBonus(investor);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/10000);
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    });

    it('reject non whitelisted purchase on whitelist bonus period: day one', async function () {
      
      const investment = ether(1);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistStart);
      
      const bonus = await this.crowdsale.getBonus(investor);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.rejectedWith(EVMRevert);
    });

    it('purchase on whitelist bonus period: day two', async function () {
      
      const investment = ether(1);
      await this.crowdsale.addToDayTwo(investor, {from: owner}).should.be.fulfilled;

      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistDayTwoStart);
      
      const bonus = await this.crowdsale.getBonus(investor);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/10000);
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
      balance.should.be.bignumber.above(tokensNoBonus);
    });

    it('reject non whitelisted purchase on whitelist bonus period: day two', async function () {
      
      const investment = ether(1);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.whitelistDayTwoStart);
      
      const bonus = await this.crowdsale.getBonus(investor);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.rejectedWith(EVMRevert);
    });
    

    it('purchase on start open bonus period', async function () {
      const investment = ether(1);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.openBonusStart);
      
      const bonus = await this.crowdsale.getBonus(investor);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/10000);
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
    });

    it('purchase during open bonus period', async function () {
      const investment = ether(1);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.openBonusStart + duration.hours(12));
      const bonus = await this.crowdsale.getBonus(investor);
      await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
      
      const expectedTokens = Math.floor(tokensNoBonus + tokensNoBonus*bonus/10000);

      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(expectedTokens);
    });

    it('purchase after bonus period', async function () {
      const investment = ether(1);
      const tokensNoBonus = investment*RATE;

      await increaseTimeTo(this.afterBonusEnd);
      const bonus = await this.crowdsale.getBonus(investor);
      const tokensReceived = await this.crowdsale.buyTokens(investor, {value: investment, from: investor}).should.be.fulfilled;
     
      const balance = await this.token.balanceOf(investor);
      balance.should.be.bignumber.equal(tokensNoBonus);
    });
});



