pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title Bonus
 * @dev Handles bonuses for a period in a crowdsale
 */
contract Bonificated is Ownable {
  using SafeMath for uint256;

  uint256 public bonusStartTime;
  uint256 public bonusDuration;
  uint256 public startBonusRate; 

  mapping(address => uint256) customBonuses; 

  function Bonificated(uint256 _bonusStartTime, uint _bonusDuration, uint _startBonusRate) public {
    bonusStartTime = _bonusStartTime;
    bonusDuration = _bonusDuration;
    startBonusRate = _startBonusRate;
  }

  //add custom bonus for pre sale investors 
  //uint bonus rate (27% => 27)
  function addCustomBonus(address investor, uint256 bonus) public onlyOwner {
    customBonuses[investor] = bonus;
  }

  function removeCustomBonus(address investor) public onlyOwner {
    delete customBonuses[investor];
  }

  //return truncated(bonus rate *100) (i.e 35,589% => 3558)
  function getBonus(address investor) public view returns (uint256) {
    uint256 customBonus = customBonuses[investor];
    if(customBonus != 0) return customBonus.mul(100);
    
    if(now < bonusStartTime || now >= bonusStartTime.add(bonusDuration)) return 0;

    return startBonusRate.mul(100).mul(bonusDuration.sub(now.sub(bonusStartTime))).div(bonusDuration);
  }
}