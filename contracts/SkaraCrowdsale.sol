pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/TokenVesting.sol';
import 'zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol';
import './Bonificated.sol';


/**
 * @title SampleCrowdsaleToken
 * @dev Very simple ERC20 Token that can be minted.
 * It is meant to be used in a crowdsale contract.
 */
contract SkaraToken is BurnableToken, MintableToken {

  string public constant name = "Skara Token";
  string public constant symbol = "SKA";
  uint8 public constant decimals = 18;

}


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
contract SkaraCrowdsale is CappedCrowdsale, Bonificated, TokenVesting {

  //Crowdsale
  uint256 public constant START_TIME = 1513357165; //  Unix Timestamp. More info at: https://www.unixtimestamp.com/
  uint256 public constant DURATION = 30 days; //Crowdsale duration
  uint256 public constant END_TIME = START_TIME + DURATION; //Crowdsale duration
  uint256 public constant RATE = 1; //SKA per ETH exchange
  address public constant WALLET = 0x0E56f09FDD14d61E456fbc45C618fD4FF10256e2; //Skara ethereum address

  //CappedCrowdsale
  uint256 public constant CAP = 1000000; //10 M€ on ETH at START_TIME

  //Bonificated
  uint256 public constant BONUS_START_TIME = START_TIME; //Start time for the bonus
  uint256 public constant BONUS_DURATION = 2 days; //Start time for the bonus
  uint256 public constant BONUS_START_VALUE = 15; //Default bonus percentage at BONUS_START_TIME

  //CappedCrowdsale
  uint256 public constant VESTING_START_TIME = START_TIME; //Start time for the vesting
  uint256 public constant VESTING_CLIF = 90 days; //Start time for the bonus
  uint256 public constant VESTING_DURATION = 365 days; //Duration of the vesting period


  function SkaraCrowdsale() public

    CappedCrowdsale(CAP)
    Bonificated(BONUS_START_TIME, BONUS_DURATION, BONUS_START_VALUE)
    Crowdsale(START_TIME, END_TIME, RATE, WALLET)
    TokenVesting(WALLET, START_TIME, VESTING_CLIF, VESTING_DURATION, false) 
  {
  }

  // overriding CappedCrowdsale#validPurchase to add extra whitelist logic
  // @return true if investor is in whitelist
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(validPurchase());

    uint256 weiAmount = msg.value;

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }

  // overriding CappedCrowdsale#validPurchase to add extra whitelist logic
  // @return true if investor is in whitelist
  function validPurchase() internal view returns (bool) {
    bool withinCap = weiRaised.add(msg.value) <= cap;
    return super.validPurchase() && withinCap;
  }



  function createTokenContract() internal returns (MintableToken) {
    return new SkaraToken();
  }

}

