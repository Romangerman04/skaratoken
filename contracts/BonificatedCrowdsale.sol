pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/crowdsale/Crowdsale.sol';

/**
 * @title Bonus
 * @dev Handles bonuses for a period in a crowdsale
 */
contract BonificatedCrowdsale is Ownable, Crowdsale {
  using SafeMath for uint256;

  uint256 public startTime;
  uint256 public duration;
  uint256 public startBonus; //truncated bonus rate *100 (35,589% = 3558)

  mapping(address => uint256) customBonuses;

  function BonificatedCrowdsale(uint256 _startTime, uint _duration, uint _startBonus) public {
    startTime = _startTime;
    duration = _duration;
    startBonus = _startBonus;
  }

  // overriding Crowdsale#buyTokens to add bonus logic
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

    token.mint(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
  }
  function addCustomBonus(address investor, uint256 bonus) onlyOwner public{
    customBonuses[investor] = bonus;
  }

  function removeCustomBonus(address investor) onlyOwner public{
    delete customBonuses[investor];
  }

  function getBonus(address investor) public view returns (uint256){
    require(now >= startTime);

    if(now >= startTime.add(duration)) return 0;

    uint256 customBonus = customBonuses[investor];
    return  customBonus != 0 ? customBonus.mul(100) : startBonus.mul(100).mul(duration.sub(now.sub(startTime))).div(duration);
  }
}