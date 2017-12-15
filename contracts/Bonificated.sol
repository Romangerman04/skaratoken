pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title Bonus
 * @dev Handles bonuses for a period in a crowdsale
 */
contract Bonificated is Ownable {
  using SafeMath for uint256;

  uint256 public startTime;
  uint256 public duration;
  uint256 public startBonus; //bonus rate *1000 (35 = 35% = .35)

  mapping(address => uint256) customBonuses;

  function Bonificated(uint256 _startTime, uint _duration, uint _startBonus) public {
    startTime = _startTime;
    duration = _duration;
    startBonus = _startBonus;
  }

  function addCustomBonus(address investor, uint256 bonus) onlyOwner public{
    customBonuses[investor] = bonus;
  }

  function removeCustomBonus(address investor) onlyOwner public{
    delete customBonuses[investor];
  }

  function getBonus(address investor) public view returns (uint256){
    require(now >= startTime);

    uint256 customBonus = customBonuses[investor];
    return  customBonus != 0 ? customBonus : startBonus.mul(now.sub(startTime)).div(duration);
  }
}