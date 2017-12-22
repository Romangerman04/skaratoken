pragma solidity ^0.4.18;


import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import 'zeppelin-solidity/contracts/token/TokenVesting.sol';

import './BonificatedCrowdsale.sol';
import './SkaraToken.sol';

/**
 * @title SampleCrowdsale
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In this example we are providing following extensions:
 * CappedCrowdsale - sets a max boundary for raised funds
 * RefundableCrowdsale - set a min goal to be reached and returns funds if it's not met
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
//contract SkaraCrowdsale is CappedCrowdsale, BonificatedCrowdsale, TokenVesting {
contract SkaraCrowdsale is CappedCrowdsale, BonificatedCrowdsale {

  //Crowdsale
  //uint256 public constant START_TIME = 1545436800; //  Unix Timestamp. More info at: https://www.unixtimestamp.com/
  //uint256 public constant DURATION = 30 days; //Crowdsale duration
  //uint256 public constant END_TIME = START_TIME + DURATION; //Crowdsale duration
  //uint256 public constant RATE = 1; //SKA per ETH exchange
  //address public constant WALLET = 0x627306090abab3a6e1400e9345bc60c78a8bef57; //Skara ethereum address

  //CappedCrowdsale
  //uint256 public constant CAP = 1000000; //10 M€ on ETH at START_TIME

  //Bonificated
  //uint256 public constant BONUS_START_TIME = START_TIME; //Start time for the bonus
  uint256 public constant BONUS_DURATION = 3 days; //Start time for the bonus
  uint256 public constant BONUS_START_VALUE = 15; //Default bonus percentage at BONUS_START_TIME

  //CappedCrowdsale
  //uint256 public constant VESTING_START_TIME = START_TIME; //Start time for the vesting
  uint256 public constant VESTING_CLIFF = 90 days; //Start time for the bonus
  uint256 public constant VESTING_DURATION = 800 days; //Duration of the vesting period

  uint256 startTime;
  // The vesting contract
  //TokenVesting vesting;

 mapping (address => TokenVesting) public vestings;

  function SkaraCrowdsale(uint256 _cap, uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet) public
    CappedCrowdsale(_cap)
    BonificatedCrowdsale(_startTime, BONUS_DURATION, BONUS_START_VALUE)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    startTime = _startTime;
  }

  function createTokenContract() internal returns (MintableToken) {
    return new SkaraToken();
  }

  // overriding Crowdsale#buyTokens to add bonus and vesting logic
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);

    //add bonus
    uint256 currentBonusMultiplier = getBonus(beneficiary).add(10000);
    tokens = tokens.mul(currentBonusMultiplier).div(10000);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    //token.transfer(beneficiary, tokens);
    

    //vesting setup
    /*
    skt.grantVestedTokens(
      beneficiary, 
      tokens, 
      startTime,
      startTime + VESTING_CLIFF,
      startTime + VESTING_DURATION, 
      false, 
      false);
    */

    TokenVesting vesting = new TokenVesting(beneficiary, startTime, VESTING_CLIFF, VESTING_DURATION, true);
    token.transfer(address(vesting), tokens);

    vestings[beneficiary] = vesting;

    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  function getVesting(address beneficiary) public view returns (TokenVesting) {
    return vestings[beneficiary];
  }

}

