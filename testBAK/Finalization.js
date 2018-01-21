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

contract('Finalization', function ([owner, investor, team, advisor, bounty]) {
  const RATE = new BigNumber(10);
  const CAP  = ether(100);
  const SALE_ALLOCATION_PERCENTAGE  = 70;
  const POSTSALE_ALLOCATION_PERCENTAGE  = 30;
  const SAFETY_ALLOCATION = new BigNumber(1000);;

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

  it('reject final token allocation before sale ends', async function () {
    await increaseTimeTo(this.startTime);
    await this.crowdsale.finalize().should.be.rejectedWith(EVMRevert);
  });

  it('accept final token allocation after sale ends', async function () {
    await increaseTimeTo(this.afterEndTime);
    await this.crowdsale.finalize({from:owner}).should.be.fulfilled;
  });
  
  it('allocate the correct amount of tokens', async function () {
    await increaseTimeTo(this.whitelistEnd + duration.days(2)); //after bonus

    const investment = ether(10);
    await this.crowdsale.buyTokens(investor, {value:investment, from: investor}).should.be.fulfilled;

    await increaseTimeTo(this.afterEndTime);
    
    const totalSale = await this.token.totalSupply();
    const total = totalSale.mul(100).div(SALE_ALLOCATION_PERCENTAGE);
    const expectedFinalAlocation = SAFETY_ALLOCATION.add((total.mul(POSTSALE_ALLOCATION_PERCENTAGE).div(100)).floor());
    
    await this.crowdsale.finalize({from:owner}).should.be.fulfilled;
    const releasable = await this.crowdsale.getReleasableAmount();
    releasable.should.be.bignumber.equal(expectedFinalAlocation);
    //const crowdsaleBalance = await this.token.balanceOf(this.crowdsale.address);
    //crowdsaleBalance.should.be.bignumber.equal(expectedFinalAlocation);
  });

  it('allow team member flow', async function () {

    //simulate token sale
    await increaseTimeTo(this.whitelistEnd + duration.days(2)); //after bonus

    const investment = ether(10);
    await this.crowdsale.buyTokens(investor, {value:investment, from: investor}).should.be.fulfilled;
        
    //setup postsaler
    const postsalerAmount = new BigNumber(10);
    await this.crowdsale.addTeamMember(team, postsalerAmount, {from:owner});

    const storedAmount = await this.crowdsale.getPostsalerAmount(team);
    storedAmount.should.be.bignumber.equal(postsalerAmount);

    await increaseTimeTo(this.afterEndTime);
  
    await this.crowdsale.finalize({from:owner}).should.be.fulfilled;
    const releasableAmount = await this.crowdsale.getReleasableAmount();
    await this.crowdsale.claimFromPostsaler(team, {from:team}).should.be.fulfilled;
    
    //vesting flow
    const hasVesting = await this.crowdsale.hasTokenVesting(team);
    hasVesting.should.be.true;

    const vestingContractAddress = await this.crowdsale.getVestingAddress(team);
    const vestingBalance = await this.token.balanceOf(vestingContractAddress);
    vestingBalance.should.be.bignumber.equal(postsalerAmount);
  });

  it('allow advisor flow', async function () {
    
    //simulate token sale
    await increaseTimeTo(this.whitelistEnd + duration.days(2)); //after bonus

    const investment = ether(10);
    await this.crowdsale.buyTokens(investor, {value:investment, from: investor}).should.be.fulfilled;
        
    //setup postsaler
    const postsalerAmount = new BigNumber(10);
    await this.crowdsale.addAdvisor(advisor, postsalerAmount, {from:owner});

    const storedAmount = await this.crowdsale.getPostsalerAmount(advisor);
    storedAmount.should.be.bignumber.equal(postsalerAmount);

    await increaseTimeTo(this.afterEndTime);
  
    await this.crowdsale.finalize({from:owner}).should.be.fulfilled;
    await this.crowdsale.claimFromPostsaler(advisor, {from:advisor}).should.be.fulfilled;
    
    //vesting flow
    const hasVesting = await this.crowdsale.hasTokenVesting(advisor);
    hasVesting.should.be.true;

    const vestingContractAddress = await this.crowdsale.getVestingAddress(advisor);
    const vestingBalance = await this.token.balanceOf(vestingContractAddress);
    vestingBalance.should.be.bignumber.equal(postsalerAmount);
  });

  it('allow bounty program member flow', async function () {
    
    //simulate token sale
    await increaseTimeTo(this.whitelistEnd + duration.days(2)); //after bonus

    const investment = ether(10);
    await this.crowdsale.buyTokens(investor, {value:investment, from: investor}).should.be.fulfilled;
        
    //setup postsaler
    const postsalerAmount = new BigNumber(10);
    await this.crowdsale.addBountyMember(bounty, postsalerAmount, {from:owner});

    const storedAmount = await this.crowdsale.getPostsalerAmount(bounty);
    storedAmount.should.be.bignumber.equal(postsalerAmount);

    await increaseTimeTo(this.afterEndTime);
  
    await this.crowdsale.finalize({from:owner}).should.be.fulfilled;
    await this.crowdsale.claimFromPostsaler(bounty, {from:bounty}).should.be.fulfilled;
    
    //vesting flow
    const hasVesting = await this.crowdsale.hasTokenVesting(bounty);
    hasVesting.should.be.false;
  
    const postsalerBalance = await this.token.balanceOf(bounty);
    postsalerBalance.should.be.bignumber.equal(postsalerAmount);
  });

  it('reject multiple claims from same postsaler', async function () {
    //simulate token sale
    await increaseTimeTo(this.whitelistEnd + duration.days(2)); //after bonus

    const investment = ether(10);
    await this.crowdsale.buyTokens(investor, {value:investment, from: investor}).should.be.fulfilled;

    await increaseTimeTo(this.afterEndTime);
    await this.crowdsale.finalize({from:owner}).should.be.fulfilled;

    //setup postsalers
    const postsalerAmount = new BigNumber(10);
    await this.crowdsale.addBountyMember(advisor, postsalerAmount, {from:owner});
   
    await this.crowdsale.claimFromPostsaler(advisor, {from:advisor}).should.be.fulfilled;
    await this.crowdsale.claimFromPostsaler(advisor, {from:advisor}).should.be.rejectedWith(EVMRevert);

  });

  it('reject claim tokens above allocation', async function () {
    //simulate token sale
    await increaseTimeTo(this.whitelistEnd + duration.days(2)); //after bonus

    const investment = ether(10);
    await this.crowdsale.buyTokens(investor, {value:investment, from: investor}).should.be.fulfilled;

    await increaseTimeTo(this.afterEndTime);
    await this.crowdsale.finalize({from:owner}).should.be.fulfilled;

    //setup postsalers
    var releasableAmount = await this.crowdsale.getReleasableAmount();
    await this.crowdsale.addBountyMember(advisor, releasableAmount, {from:owner});
    await this.crowdsale.addBountyMember(bounty, releasableAmount, {from:owner});
   
    await this.crowdsale.claimFromPostsaler(advisor, {from:bounty}).should.be.fulfilled;
    releasableAmount = await this.crowdsale.getReleasableAmount();
    await this.crowdsale.claimFromPostsaler(bounty, {from:bounty}).should.be.rejectedWith(EVMRevert);

  });
 
 });

