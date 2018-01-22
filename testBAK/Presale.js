import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMRevert from './helpers/EVMRevert'

const BigNumber = web3.BigNumber;
//BigNumber.config({ ERRORS: false }) //don't throw on >15 significant digits

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const SkaraCrowdsale = artifacts.require('SkaraCrowdsale');
const SkaraToken = artifacts.require('SkaraToken');

contract('Presale', function ([owner, investor, presaler]) {

    const RATE = new BigNumber(10);
    const CAP  = ether(1000);
    const PRESALE_CAP  = ether(60);

    const MIN_INVESTMENT  = ether(5); 
    const investmentLow  = ether(10); 
    const investmentMedium  = ether(20); 
    const MAX_INVESTMENT  = ether(30); 
    
    before(async function() {
      //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
      await advanceBlock()

      
    })
  
    beforeEach(async function () {

      //presale 
      this.presaleStartTime = latestTime() + duration.minutes(1);
      this.presaleDuration = this.presaleStartTime + duration.weeks(2);
      this.presaleEnd = this.presaleStartTime + this.presaleDuration;

      //crowdsale
      this.startTime = this.presaleEnd + duration.seconds(1);
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
    
      this.crowdsale = 
        await SkaraCrowdsale.new(
          CAP,
          PRESALE_CAP, 
          investmentLow, 
          investmentMedium, 
          this.startTime,  
          this.endTime, 
          RATE, 
          owner, 
          {from: owner});

      this.token = await SkaraToken.at(await this.crowdsale.token());
    });

    it('allow purchase on presale above min investment', async function () {
      await increaseTimeTo(this.presaleStartTime);
      const investment = ether(10);

      await this.crowdsale.buyTokens(presaler, {value: investment, from: presaler}).should.be.fulfilled;
    });

    it('reject purchase on presale below min investment', async function () {
      await increaseTimeTo(this.presaleStartTime);
      const investment = ether(2);

      await this.crowdsale.buyTokens(presaler, {value: investment, from: presaler}).should.be.rejectedWith(EVMRevert);
    });

    it('reject purchase over presale cap', async function () {
      await increaseTimeTo(this.presaleStartTime);
      const investment = ether(61);

      await this.crowdsale.buyTokens(presaler, {value: investment, from: presaler}).should.be.rejectedWith(EVMRevert);
    });

});



