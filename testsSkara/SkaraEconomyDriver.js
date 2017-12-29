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

const SkaraToken = artifacts.require('SkaraToken');
const SkaraEconomyDriver = artifacts.require('SkaraEconomyDriver');

contract('SkaraEconomyDriver', function ([owner, wallet, gamer]) {
    
    beforeEach(async function () {

       this.driver = await SkaraEconomyDriver.new(owner);
       this.token = await SkaraToken.new();
       await this.token.mint(gamer, 1000);

    });

    it('allow burn', async function () {
       
       const transferAmount = 10;
       await this.token.transfer(this.driver.address, transferAmount, {from: gamer});
       
       await this.driver.transferAndBurn(this.token.address, transferAmount).should.be.fulfilled;
      
       var driverBalance = await this.token.balanceOf(this.driver.address);
       const skaraBalance = await this.token.balanceOf(owner);

       skaraBalance.should.be.bignumber.equal(Math.floor(transferAmount/2));
       driverBalance.should.be.bignumber.equal(0);
    });


});


