pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title Bonus
 * @dev Handles bonuses for a period in a crowdsale
 */
contract Bonificated is Ownable {
  using SafeMath for uint256;

  uint256 public investmentLow; 
  uint256 public bonusPresaleLow; 
  uint256 public investmentMedium; 
  uint256 public bonusPresaleMedium; 
  uint256 public investmentHigh; 
  uint256 public bonusPresaleHigh; 

  uint256 public bonusStartTime;
  uint256 public bonusDuration;
  uint256 public bonusDayOne; 
  uint256 public bonusDayTwo; 
  uint256 public bonusDayThree; 

  mapping(address => uint256) customBonuses; 

  function Bonificated(
    uint256 _investmentLow, 
    uint256 _bonusPresaleLow, 
    uint256 _investmentMedium, 
    uint256 _bonusPresaleMedium, 
    uint256 _investmentHigh, 
    uint256 _bonusPresaleHigh, 
    uint256 _bonusStartTime,
    uint256 _bonusDuration, 
    uint256 _bonusDayOne,
    uint256 _bonusDayTwo,
    uint256 _bonusDayThree) public 
  {
    //presale bonus
    investmentLow = _investmentLow;
    bonusPresaleLow = _bonusPresaleLow;
    investmentMedium = _investmentMedium;
    bonusPresaleMedium = _bonusPresaleMedium;
    investmentHigh = _investmentHigh;
    bonusPresaleHigh = _bonusPresaleHigh;

    //whitelist + open sale bonus
    bonusStartTime = _bonusStartTime;
    bonusDuration = _bonusDuration;
    bonusDayOne = _bonusDayOne;
    bonusDayTwo = _bonusDayTwo;
    bonusDayThree = _bonusDayThree;
  }

  //add custom bonus for pre sale investors 
  //uint bonus rate (27% => 27)
  function addCustomBonus(address investor, uint256 bonus) public onlyOwner {
    _addCustomBonus(investor, bonus);
  }

  function _addCustomBonus(address investor, uint256 bonus) internal {
    customBonuses[investor] = bonus;
  }


  function removeCustomBonus(address investor) public onlyOwner {
    delete customBonuses[investor];
  }

  //return bonus rate *100 (i.e 35% => 35)
  function getBonus(address investor, uint256 investment) public view returns (uint256) {
    uint256 customBonus = customBonuses[investor];
    if(customBonus != 0) return customBonus;
    
    if(now < bonusStartTime 
      || now >= bonusStartTime.add(bonusDuration))
    {
      //presale period with bonus scaled to investment
      if(investment < investmentLow)
        return 0; //shouldn't happen, for saffety
      else if(investment < investmentMedium)
        return bonusPresaleLow;
      else if(investment < investmentHigh)
        return bonusPresaleMedium;
      else 
        return bonusPresaleHigh;
    }

    if(now < bonusStartTime + 1 days) return bonusDayOne;
    if(now < bonusStartTime + 2 days) return bonusDayTwo;
    if(now < bonusStartTime + 3 days) return bonusDayThree;
  }
}